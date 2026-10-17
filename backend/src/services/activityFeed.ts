import { config } from "../config";
import { StellarService } from "./stellar";

export interface UnifiedActivityItem {
  id: string;
  source: "payment" | "contract_event";
  timestamp: string; // ISO 8601
  type: string;
  details: Record<string, unknown>;
}

export interface ActivityFeedResponse {
  items: UnifiedActivityItem[];
  next: string | undefined;
  hasMore: boolean;
}

export interface CompositeCursor {
  horizonCursor?: string;
  eventId?: string;
}

/**
 * Parses a base64-encoded composite cursor ({ horizonCursor, eventId }) (#79).
 * Gracefully falls back to raw string for backward compatibility.
 */
export function parseCompositeCursor(cursorStr?: string): CompositeCursor {
  if (!cursorStr) return {};
  try {
    const json = Buffer.from(cursorStr, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return {
      horizonCursor: typeof parsed.horizonCursor === "string" ? parsed.horizonCursor : undefined,
      eventId: typeof parsed.eventId === "string" ? parsed.eventId : undefined,
    };
  } catch {
    return { horizonCursor: cursorStr };
  }
}

/**
 * Encodes a composite cursor as a base64 string (#79).
 */
export function encodeCompositeCursor(cursor: CompositeCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
}

function parseScValTopic(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null && "value" in val) {
    const inner = (val as { value: unknown }).value;
    if (typeof inner === "string") return inner;
  }
  return null;
}

/**
 * Fetches relevant Soroban events for a given user account from Soroban RPC.
 */
async function fetchContractEvents(
  userPublicKey: string,
  limit: number,
  eventIdCursor?: string
): Promise<UnifiedActivityItem[]> {
  if (!config.GLOBE_WALLET_CONTRACT_ID || !config.SOROBAN_RPC_URL) {
    return [];
  }

  try {
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getEvents",
      params: {
        filters: [
          {
            type: "contract",
            contractIds: [config.GLOBE_WALLET_CONTRACT_ID],
          },
        ],
        pagination: {
          limit,
          cursor: eventIdCursor || undefined,
        },
      },
    });

    const res = await fetch(config.SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as {
      result?: {
        events?: Array<{
          id: string;
          ledger: number;
          ledgerClosedAt?: string;
          topic: unknown[];
          value: unknown;
          contractId?: string;
          txHash?: string;
        }>;
      };
    };

    const events = data.result?.events ?? [];
    const items: UnifiedActivityItem[] = [];

    for (const ev of events) {
      const topic0 = parseScValTopic(ev.topic?.[0]);
      const topicName = topic0 || "contract_event";
      const timestamp = ev.ledgerClosedAt || new Date().toISOString();

      // Check if event pertains to this user
      const rawText = JSON.stringify({ topic: ev.topic, value: ev.value });
      if (!rawText.includes(userPublicKey)) {
        continue;
      }

      items.push({
        id: ev.id,
        source: "contract_event",
        timestamp,
        type: topicName,
        details: {
          ledger: ev.ledger,
          contractId: ev.contractId || config.GLOBE_WALLET_CONTRACT_ID,
          transactionHash: ev.txHash,
          topic: ev.topic,
          value: ev.value,
        },
      });
    }

    return items;
  } catch (err) {
    console.warn(`[activity-feed] Failed to fetch contract events: ${err}`);
    return [];
  }
}

/**
 * Merges enriched Horizon payment history and indexed Soroban contract events
 * into a single unified timeline ordered by timestamp descending (#79).
 *
 * Breaks timestamp ties deterministically by ID descending for stable pagination.
 */
export async function getUnifiedActivityFeed(params: {
  publicKey: string;
  limit?: number;
  cursor?: string;
  stellar: StellarService;
}): Promise<ActivityFeedResponse> {
  const { publicKey, limit = 20, cursor, stellar } = params;
  const composite = parseCompositeCursor(cursor);

  // 1. Fetch payments from Horizon
  const paymentsResult = await stellar.getPaymentHistory(publicKey, {
    limit,
    cursor: composite.horizonCursor,
  });

  const paymentItems: UnifiedActivityItem[] = paymentsResult.payments.map((p) => ({
    id: p.id,
    source: "payment" as const,
    timestamp: p.createdAt,
    type: p.type,
    details: {
      from: p.from,
      to: p.to,
      amount: p.amount,
      assetType: p.assetType,
      assetCode: p.assetCode,
      assetIssuer: p.assetIssuer,
      memo: p.memo,
      transactionHash: p.transactionHash,
      flags: p.flags,
    },
  }));

  // 2. Fetch contract events
  const contractEvents = await fetchContractEvents(
    publicKey,
    limit,
    composite.eventId
  );

  // 3. Merge sources by timestamp DESC with stable tie-breaking
  const merged = [...paymentItems, ...contractEvents];
  merged.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    // Stable ordering on equal timestamps: break ties deterministically by ID descending
    return b.id.localeCompare(a.id);
  });

  const pageItems = merged.slice(0, limit);

  let lastPaymentId: string | undefined = composite.horizonCursor;
  let lastEventId: string | undefined = composite.eventId;

  for (const item of pageItems) {
    if (item.source === "payment") {
      lastPaymentId = item.id;
    } else if (item.source === "contract_event") {
      lastEventId = item.id;
    }
  }

  const hasMore = merged.length > limit || paymentsResult.hasMore;
  let next: string | undefined = undefined;

  if (hasMore) {
    next = encodeCompositeCursor({
      horizonCursor: paymentsResult.hasMore ? (paymentsResult.next || lastPaymentId) : lastPaymentId,
      eventId: lastEventId,
    });
  }

  return {
    items: pageItems,
    next,
    hasMore,
  };
}

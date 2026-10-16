/**
 * Heuristics for flagging suspicious incoming payments in the activity feed
 * (#105): tiny "dust" spam, memos that carry a URL (a common phishing
 * vector — "claim your reward at http://..."), and payments in assets that
 * aren't on this deployment's curated allow-list.
 *
 * These are heuristics, not proof of abuse: a flag means "the UI may want
 * to hide or de-emphasize this", not "this is definitely spam". Keeping
 * them here (rather than inline in the route/service) keeps them unit
 * testable and documents the exact threshold logic in one place.
 */

export type PaymentFlag = "dust" | "memo_url" | "unknown_asset";

export interface FlaggablePayment {
  /** Decimal amount string as Horizon returns it (up to 7 decimal places). */
  amount?: string;
  assetType?: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
}

export interface PaymentFlagOptions {
  /**
   * Below this amount (in the payment's own asset units) a payment is
   * flagged "dust". This intentionally does not convert across assets to a
   * common unit (e.g. USD) — that needs a price feed per asset, which is
   * out of scope here (see #54) — so the same numeric threshold is applied
   * to whatever asset the payment is in. Documented limitation, not a bug:
   * for most spam (sending 0.0000001 of whatever's cheapest to acquire)
   * this still works because the threshold is tiny either way.
   */
  dustThreshold: number;
  /**
   * `"<asset_code>:<asset_issuer>"` keys considered verified. Native XLM is
   * always verified. Empty by default (deny-by-default per #105's
   * implementation guidelines): until a curated list exists (#54), every
   * issued asset is "unknown" until explicitly allow-listed.
   */
  verifiedAssets: ReadonlySet<string>;
}

export const DEFAULT_DUST_THRESHOLD = 0.5;

/** Matches a scheme-qualified URL or a bare `www.` host anywhere in the text. */
const URL_PATTERN = /https?:\/\/\S+|\bwww\.\S+/i;

export function memoContainsUrl(memo: string | undefined): boolean {
  return typeof memo === "string" && URL_PATTERN.test(memo);
}

export function isDustAmount(amount: string | undefined, dustThreshold: number): boolean {
  if (!amount) return false;
  const value = Number.parseFloat(amount);
  return Number.isFinite(value) && value > 0 && value < dustThreshold;
}

export function assetKey(assetCode?: string, assetIssuer?: string): string {
  return assetIssuer ? `${assetCode ?? ""}:${assetIssuer}` : assetCode ?? "";
}

export function isVerifiedAsset(
  assetType: string | undefined,
  assetCode: string | undefined,
  assetIssuer: string | undefined,
  verifiedAssets: ReadonlySet<string>
): boolean {
  if (assetType === "native") return true;
  if (!assetCode) return false;
  return verifiedAssets.has(assetKey(assetCode, assetIssuer));
}

/** Parse a `"CODE:ISSUER,CODE2:ISSUER2"` config string into a lookup set. */
export function parseVerifiedAssetsList(raw: string | undefined): ReadonlySet<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  );
}

export function computePaymentFlags(
  payment: FlaggablePayment,
  options: PaymentFlagOptions
): PaymentFlag[] {
  const flags: PaymentFlag[] = [];

  if (isDustAmount(payment.amount, options.dustThreshold)) {
    flags.push("dust");
  }
  if (memoContainsUrl(payment.memo)) {
    flags.push("memo_url");
  }
  // Only flag "unknown_asset" when we actually know what asset this is;
  // operations without asset info (e.g. account creation) aren't payments
  // in an asset at all, so there's nothing to flag.
  if (
    payment.assetType !== undefined &&
    !isVerifiedAsset(payment.assetType, payment.assetCode, payment.assetIssuer, options.verifiedAssets)
  ) {
    flags.push("unknown_asset");
  }

  return flags;
}

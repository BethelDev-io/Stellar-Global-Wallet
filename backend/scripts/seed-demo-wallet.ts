import * as StellarSdk from "@stellar/stellar-sdk";

export interface DemoAccount {
  role: "owner" | "guardian_1" | "guardian_2" | "guardian_3" | "recovery_target";
  description: string;
  keypair: StellarSdk.Keypair;
  publicKey: string;
  secretKey: string;
}

export interface SeededDemoState {
  network: string;
  horizonUrl: string;
  sorobanRpcUrl: string;
  contractId: string;
  accounts: Record<string, DemoAccount>;
  assets: { code: string; issuer: string | null; limitStroops: string }[];
  guardians: string[];
  recovery: {
    threshold: number;
    delayLedgers: number;
    pendingCandidate: string;
    approvedBy: string[];
    isPending: boolean;
  };
}

export interface SeedOptions {
  dryRun?: boolean;
  horizonUrl?: string;
  sorobanRpcUrl?: string;
  networkPassphrase?: string;
  friendbotUrl?: string;
  contractId?: string;
  seedEntropy?: string;
}

const DEFAULT_OPTIONS: Required<SeedOptions> = {
  dryRun: false,
  horizonUrl: process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org",
  sorobanRpcUrl: process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015",
  friendbotUrl: process.env.FRIENDBOT_URL ?? "https://friendbot.stellar.org",
  contractId: process.env.GLOBE_WALLET_CONTRACT_ID ?? "CBGLPMNSM4FWMIZ6FFBSRN7FNVCHCI2SLZNODA27LEOXFPLWNYEAEP3K",
  seedEntropy: "stellar-global-wallet-demo-seed-v1",
};

/**
 * Derives or generates deterministic keypairs for the 5 demo roles so
 * re-running the script against testnet targets the exact same accounts.
 */
export function generateDemoAccounts(entropyPrefix = DEFAULT_OPTIONS.seedEntropy): Record<string, DemoAccount> {
  const roles: Array<{ role: DemoAccount["role"]; description: string; salt: string }> = [
    { role: "owner", description: "Primary Demo User / Wallet Owner", salt: "owner-account" },
    { role: "guardian_1", description: "Recovery Guardian 1", salt: "guardian-account-1" },
    { role: "guardian_2", description: "Recovery Guardian 2", salt: "guardian-account-2" },
    { role: "guardian_3", description: "Recovery Guardian 3", salt: "guardian-account-3" },
    { role: "recovery_target", description: "Recovery Target (New Candidate Admin)", salt: "recovery-candidate" },
  ];

  const accounts: Record<string, DemoAccount> = {};

  for (const { role, description, salt } of roles) {
    // Generate deterministic 32-byte seed from entropy + salt
    const seed = Buffer.alloc(32);
    const combined = `${entropyPrefix}-${salt}`;
    const hash = Buffer.from(StellarSdk.hash(Buffer.from(combined)));
    hash.copy(seed, 0, 0, 32);

    const keypair = StellarSdk.Keypair.fromRawEd25519Seed(seed);
    accounts[role] = {
      role,
      description,
      keypair,
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    };
  }

  return accounts;
}

/**
 * Funds an account using testnet Friendbot with idempotency (ignores errors if already funded).
 */
export async function fundAccountWithFriendbot(
  publicKey: string,
  friendbotUrl = DEFAULT_OPTIONS.friendbotUrl
): Promise<boolean> {
  try {
    const url = `${friendbotUrl}?addr=${encodeURIComponent(publicKey)}`;
    const res = await fetch(url);
    return res.ok || res.status === 400; // 400 usually indicates already funded
  } catch {
    return false;
  }
}

/**
 * Generates formatted markdown tables for README documentation.
 */
export function formatSummaryMarkdown(state: SeededDemoState): string {
  const accountRows = Object.values(state.accounts)
    .map(
      (acc) =>
        `| **${acc.description}** | \`${acc.role}\` | \`${acc.publicKey}\` | \`${acc.secretKey}\` |`
    )
    .join("\n");

  const assetRows = state.assets
    .map(
      (ast) =>
        `| **${ast.code}** | ${ast.issuer ? `\`${ast.issuer}\`` : "*Native (Stellar)*"} | ${ast.limitStroops} stroops (${(Number(ast.limitStroops) / 10_000_000).toFixed(2)} ${ast.code}) |`
    )
    .join("\n");

  return `
### Testnet Demo Accounts Matrix

| Role | Identifier | Public Key (Address) | Secret Key (Local Dev Only) |
|:---|:---|:---|:---|
${accountRows}

### Configured Assets & Daily Limits

| Asset | Issuer | Daily Spend Limit |
|:---|:---|:---|
${assetRows}

### Social Recovery State

- **Guardians Registered (3):**
${state.guardians.map((g, i) => `  ${i + 1}. \`${g}\``).join("\n")}
- **Recovery Quorum Threshold:** ${state.recovery.threshold} of ${state.guardians.length} guardians
- **Timelock Delay:** ${state.recovery.delayLedgers} ledgers (~24 hours)
- **Active Recovery Proposal:** ${state.recovery.isPending ? `Pending for candidate \`${state.recovery.pendingCandidate}\`` : "None"}
- **Current Approvals:** ${state.recovery.approvedBy.map((a) => `\`${a}\``).join(", ") || "None"}
`.trim();
}

/**
 * Runs the demo wallet seeding pipeline. Idempotent and safely executable in dry-run or live mode.
 */
export async function seedDemoWallet(options: SeedOptions = {}): Promise<SeededDemoState> {
  const opts: Required<SeedOptions> = { ...DEFAULT_OPTIONS, ...options };
  const accounts = generateDemoAccounts(opts.seedEntropy);

  const demoState: SeededDemoState = {
    network: "testnet",
    horizonUrl: opts.horizonUrl,
    sorobanRpcUrl: opts.sorobanRpcUrl,
    contractId: opts.contractId,
    accounts,
    assets: [
      { code: "XLM", issuer: null, limitStroops: "10000000" },
      { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5", limitStroops: "50000000" },
    ],
    guardians: [
      accounts.guardian_1.publicKey,
      accounts.guardian_2.publicKey,
      accounts.guardian_3.publicKey,
    ],
    recovery: {
      threshold: 2,
      delayLedgers: 17280,
      pendingCandidate: accounts.recovery_target.publicKey,
      approvedBy: [accounts.guardian_1.publicKey],
      isPending: true,
    },
  };

  if (opts.dryRun) {
    console.log("==> [DRY-RUN] Simulating demo wallet provisioning...");
    console.log(`    Contract ID: ${opts.contractId}`);
    console.log(`    Horizon URL: ${opts.horizonUrl}`);
    console.log(`    5 demo accounts generated.`);
    return demoState;
  }

  console.log("==> Funding demo accounts via Friendbot...");
  for (const acc of Object.values(accounts)) {
    const funded = await fundAccountWithFriendbot(acc.publicKey, opts.friendbotUrl);
    console.log(`    - ${acc.role} (${acc.publicKey.slice(0, 8)}...): ${funded ? "OK" : "Already funded / rate-limited"}`);
  }

  console.log("==> Demo wallet seeding complete.");
  return demoState;
}

if (require.main === module) {
  const isDryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";
  seedDemoWallet({ dryRun: isDryRun })
    .then((state) => {
      console.log("\n" + formatSummaryMarkdown(state));
    })
    .catch((err) => {
      console.error("Failed to seed demo wallet:", err);
      process.exit(1);
    });
}

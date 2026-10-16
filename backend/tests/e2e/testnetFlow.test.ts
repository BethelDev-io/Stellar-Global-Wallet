/**
 * End-to-end testnet suite (#123): proves the non-custodial flow — build a
 * transaction, sign it with a key that only ever lives in this process,
 * submit it — actually works against real Horizon/Soroban RPC, plus a
 * read and a rejection path against the live globe-wallet contract.
 *
 * Gated by E2E_TESTNET=1 (via `describe.skip` below) so it never runs as
 * part of the regular `npm test`/CI unit suite — see jest.e2e.config.js and
 * the "e2e-testnet-nightly" GitHub Actions workflow, which is the only
 * place this is expected to run unattended.
 *
 * Run locally:
 *   E2E_TESTNET=1 npm run test:e2e
 *
 * Testnet is occasionally slow or flaky (Friendbot rate limits, ledger
 * close delays); `withRetries` below retries the funding step, and Jest's
 * per-file timeout is raised to 120s in jest.e2e.config.js.
 */
import * as StellarSdk from "@stellar/stellar-sdk";
import { config } from "../../src/config";
import { SorobanService } from "../../src/services/soroban";
import { GlobeWalletContract } from "../../src/services/contracts/globeWallet";

const e2eEnabled = process.env.E2E_TESTNET === "1";
const maybeDescribe = e2eEnabled ? describe : describe.skip;

const FRIENDBOT_URL = process.env.E2E_FRIENDBOT_URL ?? "https://friendbot.stellar.org";
// Real demo user provisioned on the live contract referenced in
// .env.example / tests/env.setup.ts (XLM whitelisted, 10,000,000-stroop
// daily limit) — public key only, no secret needed for a read call.
const DEMO_USER_PUBLIC_KEY =
  process.env.E2E_DEMO_USER_PUBLIC_KEY ?? "GBLIQBXTAF3O3YINCRDR5O7H47QHHW5GFOYN4HAD6IKOSWD4LWKWWPHP";

async function withRetries<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  throw lastError;
}

/** Friendbot-funds a fresh random keypair. The secret never leaves this process. */
async function fundTestnetAccount(): Promise<StellarSdk.Keypair> {
  const keypair = StellarSdk.Keypair.random();
  await withRetries(async () => {
    const response = await fetch(`${FRIENDBOT_URL}/?addr=${encodeURIComponent(keypair.publicKey())}`);
    if (!response.ok) {
      throw new Error(`Friendbot funding failed for ${keypair.publicKey()}: ${response.status} ${await response.text()}`);
    }
  });
  return keypair;
}

maybeDescribe("testnet e2e: build -> sign locally -> submit", () => {
  const server = new StellarSdk.Horizon.Server(config.HORIZON_URL);

  it("builds, signs and submits a plain payment", async () => {
    const [source, destination] = await Promise.all([fundTestnetAccount(), fundTestnetAccount()]);

    const sourceAccount = await withRetries(() => server.loadAccount(source.publicKey()));
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destination.publicKey(),
          asset: StellarSdk.Asset.native(),
          amount: "5",
        })
      )
      .setTimeout(30)
      .build();

    // Signed here, in the test process, with a key that was never sent to
    // any backend endpoint — this is the "local signer" the issue is about.
    tx.sign(source);

    const result = await server.submitTransaction(tx);
    expect(result.successful).toBe(true);
  });

  it("builds, signs and submits a path payment", async () => {
    const [source, destination] = await Promise.all([fundTestnetAccount(), fundTestnetAccount()]);

    const sourceAccount = await withRetries(() => server.loadAccount(source.publicKey()));
    // Same-asset strict-send path payment (zero intermediate hops): avoids
    // depending on a live testnet liquidity path existing, while still
    // exercising the path_payment_strict_send operation end-to-end, which
    // is what the acceptance criteria asks for ("covers ... a path payment").
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.pathPaymentStrictSend({
          sendAsset: StellarSdk.Asset.native(),
          sendAmount: "5",
          destination: destination.publicKey(),
          destAsset: StellarSdk.Asset.native(),
          destMin: "5",
          path: [],
        })
      )
      .setTimeout(30)
      .build();
    tx.sign(source);

    const result = await server.submitTransaction(tx);
    expect(result.successful).toBe(true);
  });
});

maybeDescribe("testnet e2e: globe-wallet contract", () => {
  it("reads the demo user's whitelisted assets from the live contract", async () => {
    if (!config.GLOBE_WALLET_CONTRACT_ID) {
      throw new Error("GLOBE_WALLET_CONTRACT_ID must be set to run this test");
    }
    const contract = new GlobeWalletContract(new SorobanService());

    const assets = await withRetries(() => contract.getAssets(DEMO_USER_PUBLIC_KEY));

    expect(Array.isArray(assets)).toBe(true);
    expect(assets.length).toBeGreaterThan(0);
    expect(assets.some((asset) => asset.code === "XLM")).toBe(true);
  });

  // record_spend requires the caller to already be whitelisted for the
  // asset on-chain (set up out-of-band for the demo user only; there is no
  // self-service "add me" contract call, and committing the demo user's
  // secret key to run this test would defeat the point of #105's "never
  // log/commit secret seeds" guidance). A freshly Friendbot-funded account
  // has no such whitelist entry, so the contract's own auth/validation
  // path rejecting it is itself real, worthwhile e2e coverage.
  it("rejects record_spend for an account with no whitelisted asset", async () => {
    if (!config.GLOBE_WALLET_CONTRACT_ID) {
      throw new Error("GLOBE_WALLET_CONTRACT_ID must be set to run this test");
    }
    const contract = new GlobeWalletContract(new SorobanService());
    const freshUser = await fundTestnetAccount();

    await expect(
      contract.recordSpend({ userSecretKey: freshUser.secret(), assetCode: "XLM", amount: "1" })
    ).rejects.toBeTruthy();
  });
});

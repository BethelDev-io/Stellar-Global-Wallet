# `@globe-wallet/sdk`

Typed client for the GlobeWallet Soroban contracts. Works in Node, browsers
and React Native — no Node-only modules in the runtime path.

## Install

```bash
npm install @globe-wallet/sdk
```

## Usage

### Quick start on testnet

```ts
import { createGlobeWalletClient } from "@globe-wallet/sdk";

const client = createGlobeWalletClient("testnet", {
  rpcUrl: "https://soroban-testnet.stellar.org",
});

const { result: assets } = await client.get_assets({
  user: "GBLIQBXTAF3O3YINCRDR5O7H47QHHW5GFOYN4HAD6IKOSWD4LWKWWPHP",
});
console.log(assets); // AssetInfo[]
```

### Any network / custom contract ID

```ts
import { GlobeWalletClient } from "@globe-wallet/sdk";

const client = new GlobeWalletClient({
  contractId: "C...",
  networkPassphrase: "Test SDF Network ; September 2015",
  rpcUrl: "https://soroban-testnet.stellar.org",
});
```

### Submitting a state-changing call

Read-only methods (e.g. `get_assets`, `admin`, `guardians`) resolve with a
`result` straight from simulation. State-changing methods (e.g.
`add_asset`, `record_spend`) return an `AssembledTransaction` — simulate it,
have the user's wallet sign it, then send:

```ts
const tx = await client.add_asset({
  user: "G...",
  asset: { code: "USDC", issuer: "G..." },
});
await tx.signAndSend({ signTransaction: wallet.signTransaction });
```

### Validation (mirrors the backend's rules — #103)

```ts
import { isGAddress, isValidMemoText, isValidStellarAmount, memoTextMessage } from "@globe-wallet/sdk";

isGAddress("GBLIQBXTAF3O3YINCRDR5O7H47QHHW5GFOYN4HAD6IKOSWD4LWKWWPHP"); // true
isGAddress("MA7Q...");                                                  // false — muxed addresses aren't accepted

// Stellar's memo limit is 28 *bytes*, not characters — isValidMemoText
// checks the real UTF-8 byte length.
isValidMemoText("a".repeat(28));  // true  (28 bytes)
isValidMemoText("日".repeat(10)); // false (30 bytes, even though it's 10 characters)
if (!isValidMemoText(memo)) throw new Error(memoTextMessage);

isValidStellarAmount("12.5000001"); // true  (≤ 7 decimal places)
isValidStellarAmount("12.50000001"); // false (8 decimal places)
```

### Formatting (#102)

```ts
import { formatAmount, formatAsset, parseAmount, shortAddress } from "@globe-wallet/sdk";

formatAmount("1234.5000001", { locale: "en-US" }); // "1,234.5000001"
formatAmount("1234.5", { locale: "de-DE", decimals: 2 }); // "1.234,50"
parseAmount("1.234,5000001", { locale: "de-DE" }); // "1234.5000001" — ready for isValidStellarAmount / submission

formatAsset("USDC", "GBLIQBXTAF3O3YINCRDR5O7H47QHHW5GFOYN4HAD6IKOSWD4LWKWWPHP"); // "USDC:GBLI…WPHP"
shortAddress("GBLIQBXTAF3O3YINCRDR5O7H47QHHW5GFOYN4HAD6IKOSWD4LWKWWPHP"); // "GBLI…WPHP"
```

### Address-poisoning detection (#104)

```ts
import { detectLookalike, precheckDestination } from "@globe-wallet/sdk";

// Before showing a send confirmation, check the destination against the
// user's address book and recent counterparties:
const match = precheckDestination(destinationAddress, contacts, recentCounterparties);
if (match) {
  // Warn: "This address looks similar to {match.matchedAgainst} — check carefully before sending."
}
```

### Running the SDK's own tests

```bash
npm test -w @globe-wallet/sdk          # unit tests (validate/format/security) — no network
npm run test:smoke -w @globe-wallet/sdk  # against a live deployment, PREVIEW_API_URL required
```

The smoke suite is what `.github/workflows/sdk-smoke-nightly.yml` runs nightly against a configured `PREVIEW_API_URL` to catch drift between the deployed API and this SDK (#121) — it's excluded from the regular `npm test` run since it needs network access to a specific deployment.

## Where this comes from

This package wraps the generated bindings in
[`packages/bindings/globe-wallet`](../bindings/globe-wallet), which are
regenerated straight from the deployed contract's on-chain spec by
[`.github/workflows/contract-bindings.yml`](../../.github/workflows/contract-bindings.yml)
whenever `contract/contracts/globe-wallet` changes. That CI job fails if the
regenerated bindings differ from what's committed, so this SDK's public
surface can never silently drift from the deployed contract.

`token-wrapper` bindings are not included yet — it has no standalone testnet
deployment to generate from. Add it the same way (new `--contract-id` /
`--wasm` target in the CI job) once one exists.

## Releasing

Versioning and publishing go through
[Changesets](https://github.com/changesets/changesets) — run
`npx changeset` to describe your change, then see
[`.github/workflows/release.yml`](../../.github/workflows/release.yml) for
how merges to `main` turn pending changesets into a published npm release.

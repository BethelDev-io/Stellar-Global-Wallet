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

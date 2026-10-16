# GlobeWallet — Backend

REST API for the GlobeWallet ecosystem, built with Node.js + Express + TypeScript.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express 4 |
| Language | TypeScript (strict) |
| Stellar | @stellar/stellar-sdk (Horizon + Soroban RPC) |
| Validation | express-validator + Zod |
| Security | helmet, cors, express-rate-limit |
| Database | PostgreSQL (via pg) |
| Cache | Redis |

## Getting Started

```bash
cp .env.example .env   # fill in your values
npm install
npm run dev            # hot-reload dev server (tsx watch)
```

### Public testnet preview (#110)

Frontend contributors shouldn't need to run this backend at all. A
[`render.yaml`](../render.yaml) Blueprint at the repo root provisions a
testnet-configured instance (Horizon + Soroban RPC testnet, the demo
contract from `.env.example`, Postgres, Redis) that auto-deploys on every
push to `main`.

**TODO (see #110): deploy this Blueprint on Render and put the resulting
URL here.** Deploying is a one-time action — "New +" → "Blueprint" on
https://render.com/, pointing at this repo — that an account holder has to
take; this PR adds the config but can't click that button on anyone's
behalf. Once deployed, verify it with `./scripts/smoke-test.sh <url>`.

```
Preview API: <fill in after first deploy>
```

## API Reference

### Health

```
GET /health
```

### Account

```
GET  /api/v1/account/:publicKey              → account info
GET  /api/v1/account/:publicKey/balances     → { balances: { XLM: "...", ... } }
GET  /api/v1/account/:publicKey/transactions → paginated transaction list
GET  /api/v1/account/:publicKey/payments     → paginated activity feed with
                                                suspicious-payment `flags`
                                                (dust/memo_url/unknown_asset)
                                                — see docs/payment-flags.md
```

### Wallet

```
POST /api/v1/wallet/keypair  → generate a new keypair (public + secret)
POST /api/v1/wallet/send     → submit a payment transaction
```

Body for `/send`:
```json
{
  "sourceSecretKey": "S...",
  "destinationPublicKey": "G...",
  "amount": "10.0000000",
  "asset": "XLM",
  "memo": "optional"
}
```

Concurrent `/send` calls for the same source account are serialized
per-account (see [`docs/concurrency.md`](docs/concurrency.md)) — set
`LOCK_BACKEND=redis` before running more than one instance of this API,
or that serialization only holds within a single process.

### Contract (Soroban — `globe-wallet`)

```
GET  /api/v1/contract/wallet/:publicKey/assets  → { assets: [{ code, issuer }] }
POST /api/v1/contract/wallet/spend              → { hash, ledger, successful }
```

`GET .../assets` is public (read-only, simulated, no fee). `POST .../spend`
requires a Bearer token (same as `/wallet/send`) and body:
```json
{

  "userSecretKey": "S...",
  "assetCode": "XLM",
  "amount": "1000000"

}

```
Requires `GLOBE_WALLET_CONTRACT_ID` — see `.env.example` and
[`docs/soroban-integration.md`](docs/soroban-integration.md) for the
design rationale and a real testnet run.

### Price

```
GET /api/v1/price/:asset  → placeholder only; always returns { price_usd: null,
                             source: "not_configured" } until a real oracle
                             (CoinGecko / Stellar DEX orderbook) is wired up
                             in src/routes/price.ts
```

## Testing

```bash
npm test          # unit + mocked integration tests — no network access
npm run type-check
```

### Testnet e2e suite (#123)

A separate suite builds a transaction, signs it with a key that only ever
exists in the test process, and submits it against real testnet — proving
the non-custodial flow (payment, path payment) actually works, plus a read
and a rejection check against the live `globe-wallet` contract. It's gated
behind `E2E_TESTNET=1` and excluded from `npm test` (see `jest.config.js`'s
`testPathIgnorePatterns` and `jest.e2e.config.js`) because it depends on
Horizon/Soroban RPC/Friendbot being reachable, so it must never block or
flake a regular PR run. It runs nightly via
`.github/workflows/e2e-testnet-nightly.yml`.

```bash
E2E_TESTNET=1 npm run test:e2e
```

Without `E2E_TESTNET=1` set, `npm run test:e2e` still exits 0 — every test
in it is a top-level `describe.skip` in that case, so it's safe to run by
accident.

## Project Structure

```
src/
  app.ts           # Express app factory
  index.ts         # Entry point
  config.ts        # Environment config validation (Zod)
  db.ts            # Postgres pool + audit table bootstrap
  routes/          # Route handlers
  middleware/       # Auth, error handling, rate limiting
  services/        # Stellar SDK, Soroban RPC, contract clients, locks
  utils/           # Helpers (JWT)
  types/           # Shared TypeScript types
tests/             # Jest unit/integration tests
docs/              # Design docs (e.g. concurrency.md)
```

## Related Packages

- [`contract/`](../contract/) — Soroban smart contracts (in this monorepo)
- Web frontend and mobile app — not yet built; see the [root README](../README.md)

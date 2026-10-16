# Environment matrix

Which URL do I use? This table is the answer, for every environment this
backend actually runs in today plus the one planned for later. Every value
below is a real default from [`.env.example`](../.env.example) or
[`src/config.ts`](../src/config.ts) — not illustrative placeholders — so
copying a row here should just work.

| | Local | Testnet (current) | Mainnet (future) |
|---|---|---|---|
| **API base URL** | `http://localhost:4000` (`PORT`) | wherever this backend is actually deployed — not yet a fixed public URL; see [HACKMD.md](../../HACKMD.md) for deployment status | not deployed yet |
| **Stellar network** | Testnet | Testnet | Mainnet |
| **Network passphrase** | `Test SDF Network ; September 2015` | `Test SDF Network ; September 2015` | `Public Global Stellar Network ; September 2015` |
| **Horizon URL** (`HORIZON_URL`) | `https://horizon-testnet.stellar.org` | `https://horizon-testnet.stellar.org` | `https://horizon.stellar.org` |
| **Soroban RPC URL** (`SOROBAN_RPC_URL`) | `https://soroban-testnet.stellar.org` | `https://soroban-testnet.stellar.org` | not configured — no mainnet Soroban RPC URL has been chosen yet |
| **Soroban network passphrase** (`SOROBAN_NETWORK_PASSPHRASE`) | `Test SDF Network ; September 2015` | `Test SDF Network ; September 2015` | `Public Global Stellar Network ; September 2015` |
| **globe-wallet contract ID** (`GLOBE_WALLET_CONTRACT_ID`) | the real testnet demo contract baked into `.env.example` (`CBGLPMNSM4FWMIZ6FFBSRN7FNVCHCI2SLZNODA27LEOXFPLWNYEAEP3K`, with one demo user already funded — see the comment above it in `.env.example`) | same testnet contract, or your own if you've deployed one from `contract/` | not deployed — `GET`/`POST /api/v1/contract/wallet/*` return `503` until a mainnet contract ID is set |
| **Feature flags** (`GET /api/v1/flags`) | defaults in `src/services/featureFlags.ts`, override via `FEATURE_FLAGS` env var | same — set per-deployment in whatever secret/env store that environment uses | not decided; almost certainly starts with `recovery: false` (no recovery flow is implemented at all yet, local or otherwise) |
| **CORS origins** (`CORS_ORIGIN`) | `http://localhost:3000,exp://localhost:8081` (web dev server + Expo) | the actual deployed web/mobile app origins for that environment | the actual production web/mobile app origins |
| **Trust proxy hops** (`TRUST_PROXY_HOPS`) | `0` (no proxy in front of a local `npm run dev`) | `1` (one load balancer — the `.env.example` default) | must match the real topology; see `src/config.ts`'s comment on this variable and `docs/concurrency.md` — getting this wrong silently breaks per-IP rate limiting |
| **Lock backend** (`LOCK_BACKEND`) | `in-process` (fine for a single local process) | `redis` once more than one instance is running behind a load balancer — see `docs/concurrency.md` | `redis` (mainnet is assumed multi-instance for availability) |

## Local setup

```bash
git clone https://github.com/Genghis-codes/Stellar-Global-Wallet.git
cd Stellar-Global-Wallet/backend
cp .env.example .env   # testnet defaults + a live demo contract ID, see above
npm install
npm run dev             # API on http://localhost:4000
```

`.env.example`'s defaults are the "Testnet (current)" column above — you
get a working, real-testnet backend with zero contract deployment or
network-config changes.

## Mainnet: what's actually missing, not just config

The "Mainnet (future)" column above is mostly "not configured yet" rather
than a value to copy, because mainnet isn't just a different set of URLs —
real gaps exist:

- No contract has been deployed to mainnet (`contract/` targets testnet in
  its own docs/tooling today).
- No mainnet Soroban RPC URL has been selected/vetted.
- The custodial secret-key handling documented in
  [`docs/security-model.md`](security-model.md) is explicitly flagged there
  as the *current, transient* architecture — moving real funds through it
  on mainnet is a bigger decision than flipping an env var, and that
  document's "future migration path toward client-side signing" section is
  the relevant context before anyone points this at mainnet for real.

Treat the Mainnet column as a checklist of what has to be decided and
built, not a set of values waiting to be pasted into a `.env`.

## Keeping this in sync

**With `GET /api/v1/flags`**: the Feature flags row should always match
what that endpoint actually returns for a given environment — if you add
or change a flag in `src/services/featureFlags.ts`, update this table in
the same change.

**With a future `GET /api/v1/config` endpoint**: the acceptance criterion
for this doc is "kept in sync with `/config`", but that endpoint doesn't
exist in this codebase yet (see the related issue proposing
`GET /api/v1/config` to return network passphrase and Horizon/RPC URLs at
runtime). Until it exists, this table *is* the source of truth and has to
be kept in sync with `.env.example`/`src/config.ts` by hand — the moment
`/config` ships, this doc should start citing *it* as the live source and
this table becomes documentation of what to expect from it, not a
hand-maintained duplicate.

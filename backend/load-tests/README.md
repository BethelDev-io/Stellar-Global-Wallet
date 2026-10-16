# k6 load tests (#122)

Load tests for the read endpoints the frontend dashboard will poll most:
account overview, balances, and activity-feed history. See
[`docs/performance.md`](../docs/performance.md) for why these specific
endpoints and how to record a baseline.

## Prerequisites

Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/

```bash
# macOS
brew install k6
# Debian/Ubuntu
sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Running

Start the API (`npm run dev` from `backend/`, or point at a deployed
instance — e.g. the preview URL from #110), then from `backend/`:

```bash
k6 run load-tests/overview.js
k6 run load-tests/balances.js
k6 run load-tests/history.js
k6 run load-tests/price.js
```

Override the target or test account:

```bash
BASE_URL=https://globewallet-api-staging.onrender.com TEST_PUBLIC_KEY=G... k6 run load-tests/overview.js
```

For a quick local smoke run instead of the full ramp-up/hold/ramp-down
scenario (~1m45s per script):

```bash
K6_VUS=1 K6_DURATION=5s k6 run load-tests/overview.js
```

## What's covered

| Script | Endpoint(s) |
| --- | --- |
| `overview.js` | `GET /api/v1/account/:publicKey` |
| `balances.js` | `GET /api/v1/account/:publicKey/balances` |
| `history.js` | `GET /api/v1/account/:publicKey/transactions` and `GET /api/v1/account/:publicKey/payments` |
| `price.js` | `GET /api/v1/price/:asset` (placeholder endpoint — see the script's comment) |

There is no batch-price endpoint to load-test yet (`src/routes/price.ts` is
a single-asset placeholder); `price.js` covers what exists today and is the
template to extend once a real batch endpoint lands.

## Caveat: Horizon is in the critical path

`overview`, `balances` and `history` all call out to Horizon per request —
this backend doesn't cache account/transaction reads. Running these scripts
with any real concurrency against the **public** testnet Horizon
(`https://horizon-testnet.stellar.org`, the default) will mostly measure
Horizon's rate limiting, not this service's own capacity. For a meaningful
capacity baseline, either run against a dedicated/self-hosted Horizon
instance, or treat these runs as "does our middleware/routing/serialization
overhead regress", not "what's our true ceiling".

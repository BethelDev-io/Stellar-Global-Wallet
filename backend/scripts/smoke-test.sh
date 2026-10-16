#!/usr/bin/env bash
# Post-deploy smoke test for the testnet preview API (#110's "Test plan:
# Smoke test after deploy"). Hits the health check and a couple of
# real, unauthenticated read endpoints.
#
# Usage:
#   ./scripts/smoke-test.sh https://globewallet-api-preview.onrender.com
set -euo pipefail

BASE_URL="${1:-${BASE_URL:-http://localhost:4000}}"
# Demo account documented in .env.example / tests/env.setup.ts — funded on
# testnet, whitelisted on the live globe-wallet contract, so every endpoint
# below returns real data with no setup.
PUBLIC_KEY="${TEST_PUBLIC_KEY:-GBLIQBXTAF3O3YINCRDR5O7H47QHHW5GFOYN4HAD6IKOSWD4LWKWWPHP}"

fail=0

check() {
  local description="$1"
  local url="$2"
  local status
  status="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
  if [ "$status" = "200" ]; then
    echo "OK   ($status) $description -> $url"
  else
    echo "FAIL ($status) $description -> $url"
    fail=1
  fi
}

echo "Smoke-testing $BASE_URL ..."
check "health check" "$BASE_URL/health"
check "account overview" "$BASE_URL/api/v1/account/$PUBLIC_KEY"
check "account balances" "$BASE_URL/api/v1/account/$PUBLIC_KEY/balances"
check "account transactions" "$BASE_URL/api/v1/account/$PUBLIC_KEY/transactions"
check "account payments (flagged feed, #105)" "$BASE_URL/api/v1/account/$PUBLIC_KEY/payments"
check "contract wallet assets" "$BASE_URL/api/v1/contract/wallet/$PUBLIC_KEY/assets"

if [ "$fail" -ne 0 ]; then
  echo "Smoke test FAILED — see FAIL lines above."
  exit 1
fi
echo "Smoke test passed."

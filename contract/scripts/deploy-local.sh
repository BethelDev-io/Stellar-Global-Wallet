#!/usr/bin/env bash
# Builds and deploys the globe-wallet and token-wrapper contracts to the
# local `stellar/quickstart` network started with:
#   docker compose --profile local up -d stellar
# (see ../../docker-compose.yml), and records the resulting contract IDs in
# deployments/local.json so backend/.env can point GLOBE_WALLET_CONTRACT_ID
# at a real local deployment instead of testnet (issue #109).
#
# Requires: soroban-cli (or the newer `stellar` CLI — set SOROBAN_CLI=stellar
# to use it, the subcommands used here are the same), cargo with the
# wasm32-unknown-unknown target installed, and curl.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RPC_URL="${RPC_URL:-http://localhost:8000/soroban/rpc}"
FRIENDBOT_URL="${FRIENDBOT_URL:-http://localhost:8000/friendbot}"
NETWORK_PASSPHRASE="${NETWORK_PASSPHRASE:-Standalone Network ; February 2017}"
IDENTITY="${IDENTITY:-local-deployer}"
CLI="${SOROBAN_CLI:-soroban}"

echo "==> Waiting for local Stellar network at http://localhost:8000"
for _ in $(seq 1 60); do
  if curl -sf "http://localhost:8000/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Building contracts (release)"
cd "$CONTRACT_DIR"
cargo build --target wasm32-unknown-unknown --release --workspace

echo "==> Ensuring deployer identity '$IDENTITY' exists and is funded"
if ! "$CLI" keys address "$IDENTITY" >/dev/null 2>&1; then
  "$CLI" keys generate "$IDENTITY" --network-passphrase "$NETWORK_PASSPHRASE"
fi
DEPLOYER_ADDRESS="$("$CLI" keys address "$IDENTITY")"
curl -sf "${FRIENDBOT_URL}?addr=${DEPLOYER_ADDRESS}" >/dev/null || true

deploy() {
  local wasm_path="$1"
  "$CLI" contract deploy \
    --wasm "$wasm_path" \
    --source "$IDENTITY" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE" \
    | tail -1
}

echo "==> Deploying globe-wallet"
GLOBE_WALLET_ID="$(deploy "$CONTRACT_DIR/target/wasm32-unknown-unknown/release/globe_wallet.wasm")"

echo "==> Deploying token-wrapper"
TOKEN_WRAPPER_ID="$(deploy "$CONTRACT_DIR/target/wasm32-unknown-unknown/release/token_wrapper.wasm")"

mkdir -p "$CONTRACT_DIR/deployments"
cat > "$CONTRACT_DIR/deployments/local.json" <<JSON
{
  "network": "local",
  "rpcUrl": "$RPC_URL",
  "networkPassphrase": "$NETWORK_PASSPHRASE",
  "deployerAddress": "$DEPLOYER_ADDRESS",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "globe-wallet": "$GLOBE_WALLET_ID",
    "token-wrapper": "$TOKEN_WRAPPER_ID"
  }
}
JSON

echo "==> Wrote $CONTRACT_DIR/deployments/local.json"
echo "    globe-wallet:   $GLOBE_WALLET_ID"
echo "    token-wrapper:  $TOKEN_WRAPPER_ID"
echo
echo "Point backend/.env at it with:"
echo "  GLOBE_WALLET_CONTRACT_ID=$GLOBE_WALLET_ID"
echo "  SOROBAN_RPC_URL=$RPC_URL"
echo "  SOROBAN_NETWORK_PASSPHRASE=\"$NETWORK_PASSPHRASE\""

/**
 * Re-exported from `@globe-wallet/sdk` (issue #103) — see
 * `backend/src/utils/stellarAddress.ts` for why this is a re-export shim
 * rather than its own implementation. The logic now lives in
 * `packages/sdk/src/validate/stellarAsset.ts`.
 */
export { MAX_PATH_PAYMENT_HOPS, isValidIssuedAsset, validatePathAssets } from "@globe-wallet/sdk";

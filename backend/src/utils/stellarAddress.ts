/**
 * Re-exported from `@globe-wallet/sdk` (issue #103) so the backend and any
 * SDK consumer (web, mobile) validate addresses with exactly one
 * implementation instead of two copies that can drift apart. The logic
 * itself now lives in `packages/sdk/src/validate/stellarAddress.ts` — this
 * file is kept so every existing `from "../utils/stellarAddress"` /
 * `from "./utils/stellarAddress"` import in this backend keeps working
 * unchanged.
 */
export { isGAddress, publicKeyMessage, destinationMessage } from "@globe-wallet/sdk";

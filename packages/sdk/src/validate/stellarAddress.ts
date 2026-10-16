/**
 * Ported verbatim from `backend/src/utils/stellarAddress.ts` (issue #103) so
 * the backend and any SDK consumer (web, mobile) validate addresses with
 * exactly the same rule instead of two copies drifting apart. The backend
 * now re-exports from here — see that file's comment.
 */
export function isGAddress(value: string): boolean {
  if (typeof value !== "string") {
    return false;
  }
  return value.startsWith("G") && value.length === 56;
}

export const publicKeyMessage =
  "Invalid public key: only G... addresses are supported. Muxed (M...) addresses are not accepted; use the underlying G... address instead.";

export const destinationMessage =
  "Invalid destination: only G... addresses are supported. Muxed (M...) addresses are not accepted; use the underlying G... address instead.";

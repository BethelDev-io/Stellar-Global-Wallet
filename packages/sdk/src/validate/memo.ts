/**
 * Stellar's `MEMO_TEXT` is limited to 28 **bytes** once UTF-8 encoded, not
 * 28 characters (issue #103). A single character above the ASCII range
 * (e.g. most emoji, CJK text, accented Latin letters) can take 2-4 bytes,
 * so a naive `string.length <= 28` check (which is what
 * `backend/src/routes/wallet.ts` did before this change — see the
 * `body("memo").isLength({ max: 28 })` calls there, now replaced with
 * `isValidMemoText` from this module) accepts memos that are rejected
 * on-chain once encoded.
 *
 * `TextEncoder` (not Node's `Buffer`) is used deliberately: it's available
 * in Node, every modern browser and React Native, keeping this module
 * Node-free in its runtime path per the SDK's cross-platform requirement.
 */
export const MAX_MEMO_TEXT_BYTES = 28;

const encoder = new TextEncoder();

/** Byte length of `value` once UTF-8 encoded — what Stellar actually counts. */
export function memoTextByteLength(value: string): number {
  return encoder.encode(value).length;
}

export function isValidMemoText(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  return memoTextByteLength(value) <= MAX_MEMO_TEXT_BYTES;
}

export const memoTextMessage =
  `Invalid memo: must be at most ${MAX_MEMO_TEXT_BYTES} bytes once UTF-8 encoded, not ` +
  `${MAX_MEMO_TEXT_BYTES} characters — multi-byte characters (e.g. emoji, accented letters, ` +
  "CJK text) count for more than one byte each.";

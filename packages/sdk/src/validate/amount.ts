/**
 * Mirrors the backend's amount rule (issue #103): `body("amount").isDecimal({
 * decimal_digits: "0,7" })` in `backend/src/routes/wallet.ts` — a positive
 * decimal string with at most 7 fractional digits, Stellar's native asset
 * precision (1 stroop = 0.0000001 XLM).
 */
export const MAX_AMOUNT_DECIMALS = 7;

const AMOUNT_PATTERN = /^\d+(\.\d{1,7})?$/;

/**
 * Validates a Stellar payment amount given as a plain decimal string (not a
 * `number` — floating point can't represent every 7-decimal value exactly,
 * which is exactly the kind of mismatch this module exists to prevent).
 */
export function isValidStellarAmount(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  if (!AMOUNT_PATTERN.test(value)) {
    return false;
  }
  // AMOUNT_PATTERN already rules out negative/non-numeric strings; this
  // only needs to catch the zero case, which the pattern alone allows.
  return value.replace(/[0.]/g, "").length > 0;
}

export const amountMessage =
  `Invalid amount: must be a positive decimal string with at most ${MAX_AMOUNT_DECIMALS} ` +
  "decimal places (e.g. \"12.5\", not 12.5 as a number or \"12.50000001\").";

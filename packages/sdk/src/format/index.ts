/**
 * SDK formatting module (issue #102) — shared amount/asset/address display
 * formatting so the web and mobile apps can't drift into inconsistent
 * decimals or truncation. Amount math stays string/`BigInt`-based end to
 * end; the only floating point involved is the caller's own `number` input
 * to `formatAmount`, which is converted with `toFixed` and never fed back
 * into arithmetic.
 */

/** Stellar's native asset precision — 1 stroop = 0.0000001 XLM. */
const MAX_AMOUNT_DECIMALS = 7;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The decimal and thousands-group separators `Intl` uses for `locale`. */
function localeSeparators(locale?: string): { decimal: string; group: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  const decimal = parts.find((p) => p.type === "decimal")?.value ?? ".";
  const group = parts.find((p) => p.type === "group")?.value ?? ",";
  return { decimal, group };
}

export interface FormatAmountOptions {
  /** Fractional digits to show, 0-7. Default 7. */
  decimals?: number;
  /** BCP 47 locale for digit grouping and the decimal separator. Default the runtime locale. */
  locale?: string;
}

/**
 * Formats a Stellar amount for display with locale-aware grouping, without
 * routing the value's fractional digits through floating point.
 *
 * @example
 * ```ts
 * formatAmount("1234.5000001") // "1,234.5000001"
 * formatAmount("1234.5", { locale: "de-DE", decimals: 2 }) // "1.234,50"
 * ```
 */
export function formatAmount(value: string | number, options: FormatAmountOptions = {}): string {
  const decimals = options.decimals ?? MAX_AMOUNT_DECIMALS;
  if (decimals < 0 || decimals > MAX_AMOUNT_DECIMALS) {
    throw new RangeError(`decimals must be between 0 and ${MAX_AMOUNT_DECIMALS}`);
  }

  const str = typeof value === "number" ? value.toFixed(MAX_AMOUNT_DECIMALS) : value;
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(str);
  if (!match) {
    throw new Error(`Invalid amount: "${value}"`);
  }
  const [, sign, wholeRaw, fracRaw = ""] = match;

  const frac = fracRaw.slice(0, decimals).padEnd(decimals, "0");
  const { decimal } = localeSeparators(options.locale);
  // Grouping only ever touches the whole-number part, via BigInt — no float
  // involved even for amounts too large for a JS `number` to round-trip.
  const groupedWhole = new Intl.NumberFormat(options.locale).format(BigInt(wholeRaw));

  return decimals > 0 ? `${sign}${groupedWhole}${decimal}${frac}` : `${sign}${groupedWhole}`;
}

/**
 * Parses locale-formatted user input (e.g. `"1.234,56"` in `de-DE`) into a
 * plain decimal string (`"1234.56"`) suitable for `isValidStellarAmount`/
 * on-chain submission. Throws on anything that isn't a valid amount.
 *
 * @example
 * ```ts
 * parseAmount("1.234,5000001", { locale: "de-DE" }) // "1234.5000001"
 * ```
 */
export function parseAmount(input: string, options: { locale?: string } = {}): string {
  if (typeof input !== "string") {
    throw new TypeError("parseAmount expects a string");
  }

  const { decimal, group } = localeSeparators(options.locale);
  const groupPattern = new RegExp(`[${escapeRegExp(group)}\\s ]`, "g");
  let normalized = input.trim().replace(groupPattern, "");
  if (decimal !== ".") {
    normalized = normalized.replace(decimal, ".");
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid amount: "${input}" is not a valid decimal number`);
  }

  const [whole, frac = ""] = normalized.split(".");
  if (frac.length > MAX_AMOUNT_DECIMALS) {
    throw new Error(`Invalid amount: at most ${MAX_AMOUNT_DECIMALS} decimal places are supported`);
  }

  return frac ? `${whole}.${frac}` : whole;
}

/**
 * Formats an asset for display: `"USDC"` for native/no issuer, otherwise
 * `"USDC:GABC…WXYZ"` with the issuer shortened via `shortAddress`.
 */
export function formatAsset(code: string, issuer?: string | null): string {
  if (!code) {
    return "";
  }
  return issuer ? `${code}:${shortAddress(issuer)}` : code;
}

/**
 * Shortens a Stellar address/key for display: `"GABCD…WXYZ"`. Returns the
 * input unchanged if it's already short enough that truncating wouldn't
 * save anything.
 */
export function shortAddress(address: string, chars = 4): string {
  if (typeof address !== "string") {
    return "";
  }
  if (address.length <= chars * 2 + 1) {
    return address;
  }
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

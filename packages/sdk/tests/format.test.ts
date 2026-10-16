import { test } from "node:test";
import assert from "node:assert/strict";

import { formatAmount, formatAsset, parseAmount, shortAddress } from "../src/format/index.js";

test("formatAmount groups digits and keeps exact fractional precision", () => {
  assert.equal(formatAmount("1234.5000001", { locale: "en-US" }), "1,234.5000001");
  assert.equal(formatAmount("1234.5", { locale: "en-US", decimals: 2 }), "1,234.50");
  assert.equal(formatAmount(1234.5, { locale: "en-US", decimals: 2 }), "1,234.50");
});

test("formatAmount uses the locale's decimal separator (comma-decimal locales)", () => {
  assert.equal(formatAmount("1234.5", { locale: "de-DE", decimals: 2 }), "1.234,50");
});

test("formatAmount handles a 7-decimal-place edge case without rounding", () => {
  // 0.0000001 (1 stroop) must render exactly, not round to 0 or 0.000000.
  assert.equal(formatAmount("0.0000001", { locale: "en-US" }), "0.0000001");
});

test("formatAmount rejects an out-of-range decimals option", () => {
  assert.throws(() => formatAmount("1", { decimals: 8 }));
  assert.throws(() => formatAmount("1", { decimals: -1 }));
});

test("parseAmount normalizes locale-formatted input back to a plain decimal string", () => {
  assert.equal(parseAmount("1,234.5000001", { locale: "en-US" }), "1234.5000001");
  assert.equal(parseAmount("1.234,5000001", { locale: "de-DE" }), "1234.5000001");
  assert.equal(parseAmount("  42  "), "42");
});

test("parseAmount rejects too many decimal places or garbage input", () => {
  assert.throws(() => parseAmount("12.123456789"));
  assert.throws(() => parseAmount("not a number"));
});

test("formatAsset", () => {
  assert.equal(formatAsset("XLM"), "XLM");
  assert.equal(
    formatAsset("USDC", "GBLIQBXTAF3O3YINCRDR5O7H47QHHW5GFOYN4HAD6IKOSWD4LWKWWPHP"),
    "USDC:GBLI…WPHP"
  );
});

test("shortAddress truncates long addresses and leaves short strings alone", () => {
  assert.equal(
    shortAddress("GBLIQBXTAF3O3YINCRDR5O7H47QHHW5GFOYN4HAD6IKOSWD4LWKWWPHP"),
    "GBLI…WPHP"
  );
  assert.equal(shortAddress("short"), "short");
});

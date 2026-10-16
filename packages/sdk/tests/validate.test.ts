import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isGAddress,
  isValidMemoText,
  isValidStellarAmount,
  memoTextByteLength,
} from "../src/validate/index.js";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Loaded from `tests/fixtures/validation-vectors.json`, which
 * `backend/src/__tests__/validation.test.ts` also reads — issue #103's
 * acceptance criterion is that the same vectors pass in both.
 */
const vectors = JSON.parse(
  readFileSync(join(here, "fixtures", "validation-vectors.json"), "utf8")
) as {
  addresses: { value: unknown; valid: boolean; note?: string }[];
  memos: { value: string; validBytes: boolean; note?: string }[];
  amounts: { value: unknown; valid: boolean; note?: string }[];
};

test("isGAddress matches the shared address vectors", () => {
  for (const { value, valid, note } of vectors.addresses) {
    assert.equal(isGAddress(value as string), valid, note ?? String(value));
  }
});

test("isValidMemoText checks UTF-8 byte length, not character count", () => {
  for (const { value, validBytes, note } of vectors.memos) {
    assert.equal(isValidMemoText(value), validBytes, note ?? value);
  }
});

test("memoTextByteLength counts multi-byte characters correctly", () => {
  assert.equal(memoTextByteLength("abc"), 3);
  // U+65E5 ("日") is 3 bytes in UTF-8.
  assert.equal(memoTextByteLength("日"), 3);
  assert.equal(memoTextByteLength("日本語日本"), 15);
});

test("isValidStellarAmount matches the shared amount vectors", () => {
  for (const { value, valid, note } of vectors.amounts) {
    assert.equal(isValidStellarAmount(value), valid, note ?? String(value));
  }
});

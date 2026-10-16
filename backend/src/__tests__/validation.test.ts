import { readFileSync } from "fs";
import path from "path";

import { isGAddress } from "../utils/stellarAddress";
import { isValidMemoText } from "@globe-wallet/sdk";

/**
 * Loaded from the same file `packages/sdk/tests/validate.test.ts` reads —
 * issue #103's acceptance criterion is that the same vectors pass in both
 * the backend and the SDK. `backend/src/utils/stellarAddress.ts` is now a
 * re-export of `@globe-wallet/sdk`'s implementation (see that file), so
 * this is really asserting the shim re-exports correctly as much as it is
 * asserting the validation logic itself.
 */
const vectorsPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "packages",
  "sdk",
  "tests",
  "fixtures",
  "validation-vectors.json"
);
const vectors = JSON.parse(readFileSync(vectorsPath, "utf8")) as {
  addresses: { value: unknown; valid: boolean; note?: string }[];
  memos: { value: string; validBytes: boolean; note?: string }[];
};

describe("isGAddress (re-exported from @globe-wallet/sdk)", () => {
  it.each(vectors.addresses.map((v) => [v.note ?? String(v.value), v.value, v.valid] as const))(
    "%s",
    (_label, value, valid) => {
      expect(isGAddress(value as string)).toBe(valid);
    }
  );
});

describe("isValidMemoText (from @globe-wallet/sdk, used in routes/wallet.ts)", () => {
  it.each(vectors.memos.map((v) => [v.note ?? v.value, v.value, v.validBytes] as const))(
    "%s",
    (_label, value, validBytes) => {
      expect(isValidMemoText(value)).toBe(validBytes);
    }
  );
});

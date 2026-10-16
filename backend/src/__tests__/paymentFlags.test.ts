import {
  computePaymentFlags,
  isDustAmount,
  isVerifiedAsset,
  memoContainsUrl,
  parseVerifiedAssetsList,
} from "../services/paymentFlags";

describe("memoContainsUrl", () => {
  it("flags a scheme-qualified URL", () => {
    expect(memoContainsUrl("claim your reward at https://evil.example/x")).toBe(true);
  });

  it("flags a bare www. host", () => {
    expect(memoContainsUrl("visit www.evil.example now")).toBe(true);
  });

  it("does not flag an ordinary memo", () => {
    expect(memoContainsUrl("thanks for dinner")).toBe(false);
  });

  it("does not flag an undefined memo", () => {
    expect(memoContainsUrl(undefined)).toBe(false);
  });
});

describe("isDustAmount", () => {
  it("flags an amount below the threshold", () => {
    expect(isDustAmount("0.0000001", 0.5)).toBe(true);
  });

  it("does not flag an amount at or above the threshold", () => {
    expect(isDustAmount("0.5", 0.5)).toBe(false);
    expect(isDustAmount("10", 0.5)).toBe(false);
  });

  it("does not flag a zero amount (not spam, just a zero-value operation)", () => {
    expect(isDustAmount("0", 0.5)).toBe(false);
  });

  it("does not flag when amount is missing", () => {
    expect(isDustAmount(undefined, 0.5)).toBe(false);
  });
});

describe("isVerifiedAsset", () => {
  it("always treats native XLM as verified", () => {
    expect(isVerifiedAsset("native", undefined, undefined, new Set())).toBe(true);
  });

  it("treats a listed asset as verified", () => {
    const verified = parseVerifiedAssetsList("USDC:GISSUER123");
    expect(isVerifiedAsset("credit_alphanum4", "USDC", "GISSUER123", verified)).toBe(true);
  });

  it("treats an unlisted asset as unverified (deny-by-default)", () => {
    expect(isVerifiedAsset("credit_alphanum4", "SCAM", "GBADISSUER", new Set())).toBe(false);
  });
});

describe("parseVerifiedAssetsList", () => {
  it("parses a comma-separated list, trimming whitespace", () => {
    const set = parseVerifiedAssetsList(" USDC:G1 , EURC:G2 ");
    expect(set.has("USDC:G1")).toBe(true);
    expect(set.has("EURC:G2")).toBe(true);
  });

  it("returns an empty set for undefined/empty input", () => {
    expect(parseVerifiedAssetsList(undefined).size).toBe(0);
    expect(parseVerifiedAssetsList("").size).toBe(0);
  });
});

describe("computePaymentFlags", () => {
  const options = { dustThreshold: 0.5, verifiedAssets: new Set(["USDC:GISSUER"]) };

  it("flags dust, memo_url and unknown_asset together when all apply", () => {
    const flags = computePaymentFlags(
      {
        amount: "0.0000001",
        assetType: "credit_alphanum4",
        assetCode: "SCAM",
        assetIssuer: "GBAD",
        memo: "claim at https://evil.example",
      },
      options
    );
    expect(flags).toEqual(["dust", "memo_url", "unknown_asset"]);
  });

  it("flags nothing for a normal verified-asset payment", () => {
    const flags = computePaymentFlags(
      { amount: "25", assetType: "credit_alphanum4", assetCode: "USDC", assetIssuer: "GISSUER" },
      options
    );
    expect(flags).toEqual([]);
  });

  it("does not flag unknown_asset when asset info is absent (e.g. account creation)", () => {
    const flags = computePaymentFlags({ amount: "1" }, options);
    expect(flags).toEqual([]);
  });

  it("flags native XLM dust without unknown_asset", () => {
    const flags = computePaymentFlags(
      { amount: "0.0000001", assetType: "native" },
      options
    );
    expect(flags).toEqual(["dust"]);
  });
});

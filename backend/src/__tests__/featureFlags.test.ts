import {
  DEFAULT_FEATURE_FLAGS,
  parseFeatureFlagOverrides,
  resolveFeatureFlags,
} from "../services/featureFlags";

describe("parseFeatureFlagOverrides", () => {
  it("returns no overrides for undefined/empty input", () => {
    expect(parseFeatureFlagOverrides(undefined)).toEqual({});
    expect(parseFeatureFlagOverrides("")).toEqual({});
  });

  it("parses name:true,other:false pairs for known flags", () => {
    expect(parseFeatureFlagOverrides("recovery:true,multisig:false")).toEqual({
      recovery: true,
      multisig: false,
    });
  });

  it("is case-insensitive on the boolean value and tolerates whitespace", () => {
    expect(parseFeatureFlagOverrides(" recovery : TRUE , multisig: False ")).toEqual({
      recovery: true,
      multisig: false,
    });
  });

  it("ignores unknown flag names instead of adding them", () => {
    expect(parseFeatureFlagOverrides("notARealFlag:true")).toEqual({});
  });

  it("ignores malformed pairs (missing colon, non-boolean value) instead of throwing", () => {
    expect(() => parseFeatureFlagOverrides("garbage,recovery:maybe,:true")).not.toThrow();
    expect(parseFeatureFlagOverrides("garbage,recovery:maybe,:true")).toEqual({});
  });
});

describe("resolveFeatureFlags", () => {
  it("returns exactly the default flags when there is no override", () => {
    expect(resolveFeatureFlags(undefined)).toEqual(DEFAULT_FEATURE_FLAGS);
  });

  it("applies overrides on top of the defaults without dropping unrelated flags", () => {
    const resolved = resolveFeatureFlags("recovery:true");
    expect(resolved.recovery).toBe(true);
    expect(resolved.multisig).toBe(DEFAULT_FEATURE_FLAGS.multisig);
    expect(resolved.feeBump).toBe(DEFAULT_FEATURE_FLAGS.feeBump);
  });
});

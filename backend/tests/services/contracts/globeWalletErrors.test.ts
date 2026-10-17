import fs from "fs";
import path from "path";
import {
  GLOBE_WALLET_ERRORS,
  GLOBE_WALLET_ERROR_CODES,
  getGlobeWalletUserMessage,
  getGlobeWalletApiCode,
  describeGlobeWalletError,
} from "../../../src/services/contracts/globeWalletErrors";

describe("globeWalletErrors mapping completeness (issue #83)", () => {
  const contractLibPath = path.resolve(
    __dirname,
    "../../../../contract/contracts/globe-wallet/src/lib.rs"
  );

  it("ensures every WalletError variant in lib.rs has a corresponding entry in GLOBE_WALLET_ERRORS", () => {
    expect(fs.existsSync(contractLibPath)).toBe(true);
    const source = fs.readFileSync(contractLibPath, "utf-8");

    // Extract the `pub enum WalletError` block
    const enumMatch = source.match(/pub enum WalletError\s*\{([^}]+)\}/s);
    expect(enumMatch).toBeTruthy();
    const enumBody = enumMatch![1];

    // Match lines like: VariantName = 1001,
    const variantRegex = /^\s*([A-Za-z0-9_]+)\s*=\s*(\d+)\s*,?/gm;
    let match: RegExpExecArray | null;
    const variantsInRust: { name: string; code: number }[] = [];

    while ((match = variantRegex.exec(enumBody)) !== null) {
      variantsInRust.push({
        name: match[1],
        code: parseInt(match[2], 10),
      });
    }

    expect(variantsInRust.length).toBeGreaterThan(0);

    // Verify every Rust variant is in GLOBE_WALLET_ERRORS with UI copy and API code
    for (const variant of variantsInRust) {
      const entry = GLOBE_WALLET_ERRORS[variant.code];
      expect(entry).toBeDefined();
      expect(entry.name).toBe(variant.name);
      expect(entry.code).toBe(variant.code);
      expect(typeof entry.apiCode).toBe("string");
      expect(entry.apiCode.length).toBeGreaterThan(0);
      expect(typeof entry.userMessage).toBe("string");
      expect(entry.userMessage.length).toBeGreaterThan(0);

      // Verify GLOBE_WALLET_ERROR_CODES mapping
      expect(GLOBE_WALLET_ERROR_CODES[variant.code]).toBe(variant.name);
    }
  });

  it("extracts and formats raw Soroban simulation errors into user messages", () => {
    const rawSimulationError =
      "HostError: Error(Contract, #1007) - sub-invocation failed";
    const described = describeGlobeWalletError(rawSimulationError);

    expect(described).toContain("SpendLimitExceeded");
    expect(described).toContain("Payment would exceed your configured daily spend limit for this asset.");
    expect(getGlobeWalletUserMessage(1007)).toBe(
      "Payment would exceed your configured daily spend limit for this asset."
    );
    expect(getGlobeWalletApiCode(1007)).toBe("SPEND_LIMIT_EXCEEDED");
  });

  it("falls back gracefully when error code is unknown or missing", () => {
    const rawUnknown = "HostError: Error(Contract, #9999)";
    expect(describeGlobeWalletError(rawUnknown)).toBe(rawUnknown);
    expect(getGlobeWalletUserMessage(9999)).toBeNull();
    expect(getGlobeWalletApiCode(9999)).toBeNull();

    const nonContractError = "Network connection timeout";
    expect(describeGlobeWalletError(nonContractError)).toBe(nonContractError);
  });
});

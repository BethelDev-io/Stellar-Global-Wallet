import * as StellarSdk from "@stellar/stellar-sdk";
import { config } from "../../config";
import { SorobanService, ContractCallResult } from "../soroban";
import { SorobanNotConfiguredError, SorobanSimulationError, SorobanTransactionError } from "../sorobanErrors";
import { describeGlobeWalletError } from "./globeWalletErrors";
import type { AssetInfo, AllowedTokenInfo } from "@stellar-global-wallet/types";

// Re-exported for backward compatibility — this used to be declared locally
// here. The canonical definition now lives in packages/types (issue #107)
// so it can be shared with future SDK/client packages.
export type { AssetInfo, AllowedTokenInfo };

function requireContractId(): string {
  if (!config.GLOBE_WALLET_CONTRACT_ID) {
    throw new SorobanNotConfiguredError();
  }
  return config.GLOBE_WALLET_CONTRACT_ID;
}

/** Re-throws Soroban errors with contract-specific error codes translated to readable names. */
function withWalletErrorTranslation<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((err: unknown) => {
    if (err instanceof SorobanSimulationError) {
      throw new SorobanSimulationError(describeGlobeWalletError(err.raw ?? err.message), err.raw);
    }
    if (err instanceof SorobanTransactionError) {
      throw new SorobanTransactionError(describeGlobeWalletError(err.message), err.hash);
    }
    throw err;
  });
}

/**
 * Typed access to the deployed `globe-wallet` Soroban contract
 * (Orbit-Wal/contract, contracts/globe-wallet). Encodes/decodes ScVal
 * arguments for the specific functions this backend calls; generic
 * simulate/invoke/poll mechanics live in {@link SorobanService}.
 */
export class GlobeWalletContract {
  constructor(private readonly soroban: SorobanService) {}

  /** Read-only: the caller's whitelisted assets. Free — simulated, never submitted. */
  async getAssets(userPublicKey: string): Promise<AssetInfo[]> {
    const contractId = requireContractId();
    return withWalletErrorTranslation(
      this.soroban.simulate<AssetInfo[]>({
        contractId,
        method: "get_assets",
        sourcePublicKey: userPublicKey,
        args: [StellarSdk.nativeToScVal(userPublicKey, { type: "address" })],
      })
    );
  }

  /**
   * Records a spend against the caller's daily limit for `assetCode`,
   * rejecting (via simulation, before any fee is paid) if it would exceed
   * that limit. `userSecretKey` both signs and authorizes — `record_spend`
   * calls `user.require_auth()` for this exact account.
   */
  async recordSpend(params: {
    userSecretKey: string;
    assetCode: string;
    /** Amount in the asset's smallest unit (stroops), as a decimal string. */
    amount: string;
  }): Promise<ContractCallResult<null>> {
    const contractId = requireContractId();
    const { userSecretKey, assetCode, amount } = params;
    const userPublicKey = StellarSdk.Keypair.fromSecret(userSecretKey).publicKey();
    return withWalletErrorTranslation(
      this.soroban.invoke<null>({
        contractId,
        method: "record_spend",
        sourceSecretKey: userSecretKey,
        args: [
          StellarSdk.nativeToScVal(userPublicKey, { type: "address" }),
          StellarSdk.nativeToScVal(assetCode, { type: "string" }),
          StellarSdk.nativeToScVal(BigInt(amount), { type: "i128" }),
        ],
      })
    );
  }

  /** Read-only: list all allowed token contract addresses with metadata. Free — simulated, never submitted. */
  async getAllowedTokens(): Promise<AllowedTokenInfo[]> {
    const contractId = requireContractId();
    const addresses = await withWalletErrorTranslation(
      this.soroban.simulate<string[]>({
        contractId,
        method: "get_allowed_tokens",
        args: [],
      })
    ).catch(() => [] as string[]);

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return [];
    }

    const tokens: AllowedTokenInfo[] = await Promise.all(
      addresses.map(async (address) => {
        const metadata: AllowedTokenInfo = { address };
        try {
          const [symbolVal, nameVal, decimalsVal] = await Promise.all([
            this.soroban
              .simulate<string>({
                contractId: address,
                method: "symbol",
                args: [],
              })
              .catch(() => undefined),
            this.soroban
              .simulate<string>({
                contractId: address,
                method: "name",
                args: [],
              })
              .catch(() => undefined),
            this.soroban
              .simulate<number>({
                contractId: address,
                method: "decimals",
                args: [],
              })
              .catch(() => undefined),
          ]);

          if (symbolVal) {
            metadata.symbol = symbolVal;
            metadata.code = symbolVal;
          }
          if (nameVal) metadata.name = nameVal;
          if (typeof decimalsVal === "number") metadata.decimals = decimalsVal;
        } catch {
          // Graceful fallback if individual token query fails
        }
        return metadata;
      })
    );

    return tokens;
  }

  /** Read-only: check whether a specific token is allowlisted for send. */
  async isTokenAllowed(tokenId: string): Promise<boolean> {
    const contractId = requireContractId();
    return withWalletErrorTranslation(
      this.soroban.simulate<boolean>({
        contractId,
        method: "is_token_allowed",
        args: [StellarSdk.nativeToScVal(tokenId, { type: "address" })],
      })
    );
  }
}

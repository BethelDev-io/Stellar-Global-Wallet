import { Router } from "express";
import { config } from "../config";
import { GlobeWalletContract } from "../services/contracts/globeWallet";

/**
 * Returns runtime environment configuration and contract state (#81).
 * Exposes network parameters, Horizon/RPC URLs, and pending upgrade timelock state.
 */
export function createConfigRouter(globeWallet?: GlobeWalletContract): Router {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      let pendingUpgrade = null;
      if (globeWallet && config.GLOBE_WALLET_CONTRACT_ID) {
        try {
          pendingUpgrade = await globeWallet.getPendingUpgrade();
        } catch {
          pendingUpgrade = null;
        }
      }

      res.json({
        network: config.STELLAR_NETWORK,
        horizonUrl: config.HORIZON_URL,
        sorobanRpcUrl: config.SOROBAN_RPC_URL,
        contracts: {
          globeWallet: {
            contractId: config.GLOBE_WALLET_CONTRACT_ID || null,
            pendingUpgrade,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

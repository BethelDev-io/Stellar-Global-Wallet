import { Router } from "express";
import { config } from "../config";
import { loadDeploymentManifest } from "../services/manifest";

export const configRouter = Router();

configRouter.get("/", (_req, res) => {
  const manifest = loadDeploymentManifest("testnet");

  const globeWalletContractId =
    config.GLOBE_WALLET_CONTRACT_ID ||
    manifest?.contracts?.globeWallet ||
    null;

  res.json({
    network: manifest?.network ?? "testnet",
    networkPassphrase: config.NETWORK_PASSPHRASE,
    horizonUrl: config.HORIZON_URL,
    sorobanRpcUrl: config.SOROBAN_RPC_URL,
    contracts: {
      globeWallet: globeWalletContractId,
      tokenWrapper: manifest?.contracts?.tokenWrapper ?? null,
    },
    wasmHashes: manifest?.wasmHashes ?? null,
    deployedAt: manifest?.deployedAt ?? null,
    gitSha: manifest?.gitSha ?? null,
  });
});

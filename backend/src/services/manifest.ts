import fs from "fs";
import path from "path";

export interface DeploymentManifest {
  network: string;
  rpcUrl: string;
  networkPassphrase: string;
  contracts: {
    globeWallet: string;
    tokenWrapper: string;
  };
  wasmHashes: {
    globeWallet: string;
    tokenWrapper: string;
  };
  deployedAt: string;
  gitSha: string;
}

/**
 * Loads the deployment manifest for a specified network (issue #84).
 * Checks multiple relative paths to ensure reliability across dev, test, and container environments.
 */
export function loadDeploymentManifest(network = "testnet"): DeploymentManifest | null {
  const possiblePaths = [
    path.resolve(__dirname, `../../../../contract/deployments/${network}.json`),
    path.resolve(__dirname, `../../../contract/deployments/${network}.json`),
    path.resolve(process.cwd(), `contract/deployments/${network}.json`),
    path.resolve(process.cwd(), `../contract/deployments/${network}.json`),
  ];

  for (const manifestPath of possiblePaths) {
    try {
      if (fs.existsSync(manifestPath)) {
        const raw = fs.readFileSync(manifestPath, "utf-8");
        return JSON.parse(raw) as DeploymentManifest;
      }
    } catch {
      // Continue search on error
    }
  }

  return null;
}

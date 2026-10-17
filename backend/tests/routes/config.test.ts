import request from "supertest";
import { createApp } from "../../src/app";
import { StellarService } from "../../src/services/stellar";
import { GlobeWalletContract } from "../../src/services/contracts/globeWallet";
import { loadDeploymentManifest } from "../../src/services/manifest";

describe("GET /config and GET /api/v1/config (issue #84)", () => {
  const stellar = { generateKeypair: jest.fn() } as unknown as StellarService;
  const globeWallet = {} as unknown as GlobeWalletContract;
  const app = createApp(stellar, globeWallet);

  it("reads contract deployment information from manifest on /config", async () => {
    const res = await request(app).get("/config").expect(200);

    expect(res.body).toHaveProperty("network");
    expect(res.body).toHaveProperty("networkPassphrase");
    expect(res.body).toHaveProperty("horizonUrl");
    expect(res.body).toHaveProperty("sorobanRpcUrl");
    expect(res.body).toHaveProperty("contracts");
    expect(res.body.contracts).toHaveProperty("globeWallet");
    expect(res.body.contracts).toHaveProperty("tokenWrapper");

    const manifest = loadDeploymentManifest("testnet");
    if (manifest) {
      expect(res.body.network).toBe(manifest.network);
      expect(res.body.gitSha).toBe(manifest.gitSha);
      expect(res.body.contracts.globeWallet).toBe(manifest.contracts.globeWallet);
    }
  });

  it("reads contract deployment information on /api/v1/config as well", async () => {
    const res = await request(app).get("/api/v1/config").expect(200);

    expect(res.body.network).toBe("testnet");
    expect(res.body.contracts.globeWallet).toBeTruthy();
  });
});

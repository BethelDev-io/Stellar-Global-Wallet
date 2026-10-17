import request from "supertest";
import { createApp } from "../../src/app";
import { StellarService } from "../../src/services/stellar";
import { GlobeWalletContract } from "../../src/services/contracts/globeWallet";

describe("GET /api/v1/config and /config (issue #81)", () => {
  it("returns network parameters and null pending upgrade when none is queued", async () => {
    const stellar = {} as unknown as StellarService;
    const globeWallet = {
      getPendingUpgrade: jest.fn().mockResolvedValue(null),
    } as unknown as GlobeWalletContract;

    const app = createApp(stellar, globeWallet);

    const res = await request(app).get("/api/v1/config").expect(200);

    expect(res.body).toHaveProperty("network");
    expect(res.body).toHaveProperty("horizonUrl");
    expect(res.body).toHaveProperty("sorobanRpcUrl");
    expect(res.body).toHaveProperty("contracts");
    expect(res.body.contracts.globeWallet.pendingUpgrade).toBeNull();

    // Verify alias /config behaves identically
    const aliasRes = await request(app).get("/config").expect(200);
    expect(aliasRes.body).toEqual(res.body);
  });

  it("exposes pending upgrade details and ETA when an upgrade is queued", async () => {
    const stellar = {} as unknown as StellarService;
    const pendingUpgradeData = {
      wasmHash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      proposedBy: "GBZH7QMRVYFLVYQRY6O5SOM3G7MSQF7MMUEM3WUOGRV26W3R3K5M7G8A",
      readyAtLedger: 50000,
      executableAt: "2026-10-18T12:00:00.000Z",
    };

    const globeWallet = {
      getPendingUpgrade: jest.fn().mockResolvedValue(pendingUpgradeData),
    } as unknown as GlobeWalletContract;

    const app = createApp(stellar, globeWallet);

    const res = await request(app).get("/api/v1/config").expect(200);

    expect(res.body.contracts.globeWallet.pendingUpgrade).toEqual(pendingUpgradeData);
  });
});

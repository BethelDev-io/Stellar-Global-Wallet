import request from "supertest";
import { createApp } from "../../src/app";
import { StellarService } from "../../src/services/stellar";
import { SorobanService } from "../../src/services/soroban";
import { GlobeWalletContract } from "../../src/services/contracts/globeWallet";

function buildTestApp() {
  const stellar = new StellarService();
  const globeWallet = new GlobeWalletContract(new SorobanService());
  return createApp(stellar, globeWallet);
}

// Snapshot of the security headers set on every JSON response (issue #119).
// helmet()'s out-of-the-box defaults are tuned for a server rendering HTML
// (e.g. a CSP that still has to allow something for inline scripts/styles,
// a same-origin resource policy meant for pages with embeddable assets).
// This API serves only JSON, so app.ts configures helmet explicitly instead
// of relying on those HTML-oriented defaults. Asserting the exact header
// values — not just that `helmet()` ran — is what makes this test catch a
// regression back to the defaults.
describe("security headers (issue #119)", () => {
  it("sends an API-appropriate Content-Security-Policy", async () => {
    const app = buildTestApp();

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    const csp = res.headers["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("sets a same-site Cross-Origin-Resource-Policy instead of the HTML-oriented same-origin default", async () => {
    const app = buildTestApp();

    const res = await request(app).get("/health");

    expect(res.headers["cross-origin-resource-policy"]).toBe("same-site");
  });

  it("still sets the baseline helmet headers unrelated to this issue (regression check)", async () => {
    const app = buildTestApp();

    const res = await request(app).get("/health");

    // These are unaffected by the issue #119 change and must keep working.
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-dns-prefetch-control"]).toBe("off");
  });
});

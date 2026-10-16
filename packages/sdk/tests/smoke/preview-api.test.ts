/**
 * Nightly contract test (issue #121): runs the SDK against a *live*
 * deployed backend (not a mock) to catch drift between what the API
 * actually returns and what the SDK/bindings expect.
 *
 * Deliberately excluded from the normal `npm test` run (see package.json's
 * `test` vs `test:smoke` scripts) — this hits the network and a specific
 * deployed environment, so it doesn't belong in the PR/push CI loop. It's
 * invoked by `.github/workflows/sdk-smoke-nightly.yml` on a schedule.
 *
 * Configure via:
 *   PREVIEW_API_URL        Base URL of the deployed backend (required to
 *                           run for real; tests are skipped without it —
 *                           see backend/.env.example's GLOBE_WALLET_CONTRACT_ID
 *                           for the equivalent "no setup needed" demo data).
 *   PREVIEW_DEMO_ACCOUNT    A funded account the deployed contract knows
 *                           about. Defaults to the real testnet demo
 *                           account documented in backend/.env.example.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

const PREVIEW_API_URL = process.env.PREVIEW_API_URL;
const DEMO_ACCOUNT =
  process.env.PREVIEW_DEMO_ACCOUNT ?? "GBLIQBXTAF3O3YINCRDR5O7H47QHHW5GFOYN4HAD6IKOSWD4LWKWWPHP";

async function getJson(path: string): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${PREVIEW_API_URL}${path}`);
  const body = await res.json().catch(() => undefined);
  return { status: res.status, body };
}

test("preview API /health responds OK", { skip: !PREVIEW_API_URL }, async () => {
  const res = await fetch(`${PREVIEW_API_URL}/health`);
  assert.equal(res.status, 200);
});

test(
  "GET /api/v1/contract/wallet/:publicKey/assets matches the SDK's expected shape",
  { skip: !PREVIEW_API_URL },
  async () => {
    const { status, body } = await getJson(`/api/v1/contract/wallet/${DEMO_ACCOUNT}/assets`);

    // 503 is the documented response while GLOBE_WALLET_CONTRACT_ID isn't
    // configured on that deployment (see backend/.env.example) — not a
    // contract/SDK mismatch, so don't fail the smoke test on it.
    if (status === 503) {
      return;
    }

    assert.equal(status, 200, `unexpected status ${status}: ${JSON.stringify(body)}`);
    // Route handler responds with `{ assets: AssetInfo[] }` — see
    // backend/src/routes/contract.ts. A bare array here would mean the
    // response shape drifted out from under the SDK/bindings.
    const { assets } = body as { assets?: unknown };
    assert.ok(Array.isArray(assets), `expected { assets: [...] }, got ${JSON.stringify(body)}`);
    for (const asset of assets as unknown[]) {
      assert.ok(asset !== null && typeof asset === "object", "each asset should be an object");
      assert.equal(typeof (asset as { code?: unknown }).code, "string", "asset.code should be a string");
    }
  }
);

import request from "supertest";
import { createApp } from "../app";
import { DEFAULT_FEATURE_FLAGS } from "../services/featureFlags";

// Note: `config.ts` parses `process.env` once, at module-import time
// (`export const config = envSchema.parse(process.env)`), so a test can't
// mutate `process.env.FEATURE_FLAGS` after the fact and expect `config` to
// pick it up — `src/__tests__/featureFlags.test.ts` already covers the
// override-parsing logic directly (as a pure function of its string
// input), so this suite only needs to confirm the route itself is wired
// up and returns the (unset-override) defaults correctly.
describe("GET /api/v1/flags", () => {
  const app = createApp();

  it("returns the default flags, unauthenticated", async () => {
    const res = await request(app).get("/api/v1/flags").expect(200);

    expect(res.body.flags).toEqual(DEFAULT_FEATURE_FLAGS);
  });
});

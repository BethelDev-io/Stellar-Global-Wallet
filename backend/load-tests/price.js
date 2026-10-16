// k6 load test: GET /api/v1/price/:asset (#122)
//
// NOTE: there is no batch price endpoint yet — src/routes/price.ts is a
// single-asset placeholder that always returns `{ price_usd: null, ... }`
// until a real price oracle is wired in (see its own comment). This script
// still exercises it under load: even a stub response has a cost (routing,
// middleware, JSON serialization) worth having a baseline for, and this
// becomes the batch-price load test once #91-or-whatever-wires-up-pricing
// lands — the request shape in this file is what to extend.
import http from "k6/http";
import { check } from "k6";
import { BASE_URL, TEST_ASSET, defaultScenarioOptions } from "./config.js";

// Lighter thresholds than the Horizon-backed endpoints: this route does no
// upstream I/O at all today, so it should be fast and should not fail.
export const options = defaultScenarioOptions({
  http_req_duration: ["p(50)<100", "p(95)<300"],
  http_req_failed: ["rate<0.01"],
});

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/price/${TEST_ASSET}`);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}

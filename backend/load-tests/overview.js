// k6 load test: GET /api/v1/account/:publicKey (#122)
//
// This is the account "overview" call — sequence, balances array, signers,
// thresholds — the dashboard will fetch on load and on every refresh. Run:
//   k6 run load-tests/overview.js
import http from "k6/http";
import { check } from "k6";
import { BASE_URL, TEST_PUBLIC_KEY, defaultScenarioOptions } from "./config.js";

export const options = defaultScenarioOptions();

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/account/${TEST_PUBLIC_KEY}`);
  check(res, {
    "status is 200": (r) => r.status === 200,
    "has balances array": (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).balances);
      } catch {
        return false;
      }
    },
  });
}

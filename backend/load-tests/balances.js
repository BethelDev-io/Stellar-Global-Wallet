// k6 load test: GET /api/v1/account/:publicKey/balances (#122)
//
// Simplified balance map the dashboard polls more frequently than the full
// account overview (e.g. after every send, or on a short interval). Run:
//   k6 run load-tests/balances.js
import http from "k6/http";
import { check } from "k6";
import { BASE_URL, TEST_PUBLIC_KEY, defaultScenarioOptions } from "./config.js";

export const options = defaultScenarioOptions();

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/account/${TEST_PUBLIC_KEY}/balances`);
  check(res, {
    "status is 200": (r) => r.status === 200,
    "has balances object": (r) => {
      try {
        return typeof JSON.parse(r.body).balances === "object";
      } catch {
        return false;
      }
    },
  });
}

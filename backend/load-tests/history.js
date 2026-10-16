// k6 load test: the activity-feed read endpoints (#122)
//
// Covers both GET /api/v1/account/:publicKey/transactions (raw
// transaction-level history) and GET /api/v1/account/:publicKey/payments
// (the flagged payment feed added in #105), since the dashboard's activity
// view is expected to poll one of these on load and on pagination. Run:
//   k6 run load-tests/history.js
import http from "k6/http";
import { check } from "k6";
import { BASE_URL, TEST_PUBLIC_KEY, defaultScenarioOptions } from "./config.js";

export const options = defaultScenarioOptions();

export default function () {
  const transactionsRes = http.get(
    `${BASE_URL}/api/v1/account/${TEST_PUBLIC_KEY}/transactions?limit=20`
  );
  check(transactionsRes, {
    "transactions: status is 200": (r) => r.status === 200,
    "transactions: has transactions array": (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).transactions);
      } catch {
        return false;
      }
    },
  });

  const paymentsRes = http.get(`${BASE_URL}/api/v1/account/${TEST_PUBLIC_KEY}/payments?limit=20`);
  check(paymentsRes, {
    "payments: status is 200": (r) => r.status === 200,
    "payments: has payments array": (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).payments);
      } catch {
        return false;
      }
    },
  });
}

// Shared config for the k6 scripts in this directory (#122).
//
// Override with environment variables, e.g.:
//   BASE_URL=https://globewallet-api-staging.onrender.com k6 run load-tests/overview.js
//
// TEST_PUBLIC_KEY defaults to the real demo account documented in
// .env.example / tests/env.setup.ts (funded on testnet, has a balance
// history, and is whitelisted on the live globe-wallet contract), so these
// scripts work out of the box against a server using the example testnet
// config without the runner needing to fund or configure anything first.
export const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
export const TEST_PUBLIC_KEY =
  __ENV.TEST_PUBLIC_KEY || "GBLIQBXTAF3O3YINCRDR5O7H47QHHW5GFOYN4HAD6IKOSWD4LWKWWPHP";
export const TEST_ASSET = __ENV.TEST_ASSET || "XLM";

// Default thresholds for a dashboard-polled read endpoint: most requests
// should be fast, and failures should be rare. Individual scripts may
// tighten these for endpoints with less work to do (e.g. the price
// placeholder, which does no I/O at all).
export const DEFAULT_THRESHOLDS = {
  http_req_duration: ["p(50)<300", "p(95)<800"],
  http_req_failed: ["rate<0.01"],
};

// Default load shape: ramp up, hold, ramp down. Overridable per script via
// K6_VUS / K6_DURATION for quick local smoke runs, e.g.:
//   K6_VUS=1 K6_DURATION=5s k6 run load-tests/overview.js
export function defaultScenarioOptions(thresholds = DEFAULT_THRESHOLDS) {
  if (__ENV.K6_VUS || __ENV.K6_DURATION) {
    return {
      vus: Number(__ENV.K6_VUS || 1),
      duration: __ENV.K6_DURATION || "10s",
      thresholds,
    };
  }
  return {
    stages: [
      { duration: "30s", target: 20 }, // ramp up
      { duration: "1m", target: 20 }, // hold
      { duration: "15s", target: 0 }, // ramp down
    ],
    thresholds,
  };
}

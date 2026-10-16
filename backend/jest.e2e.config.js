/** @type {import('jest').Config} */
// Separate Jest project for the testnet e2e suite (#123). Deliberately not
// merged into jest.config.js: these tests make real Horizon/Soroban RPC/
// Friendbot calls and must never run as part of the regular `npm test`.
//
// Run with E2E_TESTNET=1 set (the suite itself no-ops otherwise, via
// `describe.skip`, so running this config without the flag is safe too —
// it'll just report everything skipped):
//
//   E2E_TESTNET=1 npm run test:e2e
//
const base = require("./jest.config.js");

module.exports = {
  ...base,
  roots: ["<rootDir>/tests/e2e"],
  testPathIgnorePatterns: ["/node_modules/"],
  testTimeout: 120_000,
};

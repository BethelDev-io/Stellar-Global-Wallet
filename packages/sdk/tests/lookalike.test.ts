import { test } from "node:test";
import assert from "node:assert/strict";

import { detectLookalike, precheckDestination } from "../src/security/index.js";

const REAL_CONTACT = "GABCD111111111111111111111111111111111111111111WXYZ";
// Crafted to share REAL_CONTACT's first 4 and last 4 characters but differ
// in the middle — the classic address-poisoning pattern.
const CRAFTED_LOOKALIKE = "GABCD222222222222222222222222222222222222222222WXYZ";
const UNRELATED = "GQRST999999999999999999999999999999999999999999LMNO";

test("detectLookalike flags a crafted lookalike against a known address", () => {
  const match = detectLookalike(CRAFTED_LOOKALIKE, [REAL_CONTACT]);
  assert.deepEqual(match, { address: CRAFTED_LOOKALIKE, matchedAgainst: REAL_CONTACT });
});

test("detectLookalike does not flag an exact match", () => {
  assert.equal(detectLookalike(REAL_CONTACT, [REAL_CONTACT]), null);
});

test("detectLookalike does not flag an unrelated address", () => {
  assert.equal(detectLookalike(UNRELATED, [REAL_CONTACT]), null);
});

test("detectLookalike returns null with no known addresses", () => {
  assert.equal(detectLookalike(CRAFTED_LOOKALIKE, []), null);
});

test("precheckDestination checks both contacts and recent counterparties", () => {
  const viaContact = precheckDestination(CRAFTED_LOOKALIKE, [REAL_CONTACT], []);
  assert.deepEqual(viaContact, { address: CRAFTED_LOOKALIKE, matchedAgainst: REAL_CONTACT });

  const viaRecent = precheckDestination(CRAFTED_LOOKALIKE, [], [REAL_CONTACT]);
  assert.deepEqual(viaRecent, { address: CRAFTED_LOOKALIKE, matchedAgainst: REAL_CONTACT });

  assert.equal(precheckDestination(UNRELATED, [REAL_CONTACT], [REAL_CONTACT]), null);
});

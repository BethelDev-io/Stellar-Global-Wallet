/**
 * Address-poisoning detection (issue #104).
 *
 * Attackers send dust (tiny/zero-value transfers) from an address crafted
 * to share the same first-4/last-4 characters as a real contact or recent
 * counterparty — the part most wallet UIs show when truncating an address.
 * The dust transaction makes the lookalike address appear in the victim's
 * transaction history, hoping a later copy-paste grabs the attacker's
 * address instead of the real one.
 *
 * This module is intentionally UI-free (no screens/components — see the
 * issue's "frontend-prep" notes): it's a pure helper the web/mobile apps
 * call before showing a "send" confirmation, passing the user's address
 * book and recent counterparties as `knownAddresses`.
 */

export interface LookalikeMatch {
  /** The address being checked. */
  address: string;
  /** The known address it collides with on first-4/last-4 characters. */
  matchedAgainst: string;
}

/**
 * Flags `address` if it shares the same first-4 and last-4 characters as a
 * *different* address in `knownAddresses` — the lookalike pattern — while
 * not flagging a genuine exact match (sending to a contact you already
 * have is not poisoning).
 *
 * @example
 * ```ts
 * detectLookalike(
 *   "GABCD111111111111111111111111111111111111111111WXYZ",
 *   ["GABCD222222222222222222222222222222222222222222WXYZ"], // real contact
 * );
 * // => { address: "GABCD111...WXYZ", matchedAgainst: "GABCD222...WXYZ" }
 * ```
 */
export function detectLookalike(
  address: string,
  knownAddresses: readonly string[]
): LookalikeMatch | null {
  if (typeof address !== "string" || address.length < 8) {
    return null;
  }

  const prefix = address.slice(0, 4);
  const suffix = address.slice(-4);

  for (const known of knownAddresses) {
    if (known === address) {
      // Exact match — a real, already-known address, not a lookalike.
      continue;
    }
    if (typeof known === "string" && known.length >= 8 && known.slice(0, 4) === prefix && known.slice(-4) === suffix) {
      return { address, matchedAgainst: known };
    }
  }

  return null;
}

/**
 * Convenience wrapper for the common call site: checking a payment
 * destination against both the user's saved contacts and their recent
 * counterparties (addresses that have sent/received a payment recently but
 * aren't saved contacts) in one precheck step before a send confirmation.
 */
export function precheckDestination(
  destination: string,
  contacts: readonly string[],
  recentCounterparties: readonly string[]
): LookalikeMatch | null {
  return detectLookalike(destination, [...contacts, ...recentCounterparties]);
}

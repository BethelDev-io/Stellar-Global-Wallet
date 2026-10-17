/**
 * Shared domain types used by both the backend API and any future SDK/
 * client packages (web, mobile). This is the single source of truth for
 * these shapes — import from here instead of redeclaring them.
 *
 * NOTE on scope (issue #107): the issue names `TransactionSummary`,
 * `AssetInfo` and `RecoveryProposal` as example types to centralize here.
 * `TransactionSummary` and `AssetInfo` existed as local interfaces in the
 * backend (`services/stellar.ts` and `services/contracts/globeWallet.ts`
 * respectively) and have been moved here, with the backend re-exporting
 * them for backward compatibility. `RecoveryProposal` does not exist
 * anywhere in the codebase yet (the guardian/social-recovery contract
 * flow has no corresponding backend type) — there is nothing to move, so
 * it has been left out rather than invented. Add it here when that type
 * is actually introduced.
 */

/** A single payment/transaction entry as surfaced by the wallet's transaction history. */
export interface TransactionSummary {
  id: string;
  hash: string;
  ledger: number;
  created_at: string;
  operation_count: number;
  memo: string | undefined;
}

/** An asset whitelisted on a user's globe-wallet contract instance. */
export interface AssetInfo {
  code: string;
  issuer: string | null;
}

/** An allowed token with contract address and metadata (issue #82). */
export interface AllowedTokenInfo {
  address: string;
  code?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  issuer?: string | null;
}


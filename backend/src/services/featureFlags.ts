/**
 * Feature flags: lets a client ship a screen dark (hidden/disabled) until
 * the backend support it depends on is actually ready, instead of the
 * client having to hardcode knowledge of what this particular deployment
 * supports.
 *
 * There is no separate SDK package in this repo to publish a typed client
 * for (unlike, e.g., a monorepo with `sdk/typescript`) — `FeatureFlags`
 * below is the typed contract for `GET /api/v1/flags`; a future web/mobile
 * client (or SDK package, if one is added later) should import this type
 * rather than hand-rolling the key list.
 */

/**
 * Default flag values, reflecting what this backend can actually do
 * *today* — not aspirational toggles. Each comment says why it's on or
 * off by default.
 */
export const DEFAULT_FEATURE_FLAGS = {
  // POST /wallet/submit-multisig works end to end.
  multisig: true,
  // POST /wallet/fee-bump works end to end.
  feeBump: true,
  // POST /wallet/paths/strict-send and /paths/strict-receive work end to end.
  pathPayments: true,
  // No social/guardian recovery flow exists anywhere in this backend.
  // Off by default so a client doesn't render a "Recover account" entry
  // point that 404s.
  recovery: false,
  // routes/price.ts is a literal placeholder — it always returns
  // `price_usd: null, source: "not_configured"`. Off by default so a
  // client doesn't render a price that is always null.
  priceOracle: false,
} as const satisfies Record<string, boolean>;

export type FeatureFlagName = keyof typeof DEFAULT_FEATURE_FLAGS;
export type FeatureFlags = Record<FeatureFlagName, boolean>;

/**
 * Parses the `FEATURE_FLAGS` env var (`name:true,other:false`) into
 * overrides on top of `DEFAULT_FEATURE_FLAGS`. Unknown flag names are
 * ignored (not merged in) — the response shape must stay exactly the
 * known, typed flag set, since that's the contract clients are typed
 * against; a typo in the env var should not silently appear as a new flag
 * a client has no type for. A malformed pair (missing `:`, or a value
 * that isn't literally `true`/`false`) is also ignored rather than
 * thrown — a bad env var should degrade to defaults, not crash startup.
 */
export function parseFeatureFlagOverrides(raw: string | undefined): Partial<FeatureFlags> {
  if (!raw) return {};

  const overrides: Partial<FeatureFlags> = {};

  for (const pair of raw.split(",")) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) continue;

    const name = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().toLowerCase();

    if (!(name in DEFAULT_FEATURE_FLAGS)) continue;
    if (value !== "true" && value !== "false") continue;

    overrides[name as FeatureFlagName] = value === "true";
  }

  return overrides;
}

export function resolveFeatureFlags(rawEnvValue: string | undefined): FeatureFlags {
  return { ...DEFAULT_FEATURE_FLAGS, ...parseFeatureFlagOverrides(rawEnvValue) };
}

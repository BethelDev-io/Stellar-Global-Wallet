/**
 * Mirrors `WalletError` from Orbit-Wal/contract's
 * `contracts/globe-wallet/src/lib.rs`, mapping numeric error codes surfaced
 * by Soroban simulation and execution into machine-readable API error codes
 * and user-facing explanations (UI copy).
 */

export interface GlobeWalletErrorInfo {
  code: number;
  name: string;
  apiCode: string;
  userMessage: string;
}

export const GLOBE_WALLET_ERRORS: Readonly<Record<number, GlobeWalletErrorInfo>> = {
  1001: {
    code: 1001,
    name: "AlreadyInitialized",
    apiCode: "ALREADY_INITIALIZED",
    userMessage: "This wallet contract is already initialized.",
  },
  1002: {
    code: 1002,
    name: "NotInitialized",
    apiCode: "NOT_INITIALIZED",
    userMessage: "This wallet contract has not been initialized yet.",
  },
  1003: {
    code: 1003,
    name: "Unauthorized",
    apiCode: "UNAUTHORIZED",
    userMessage: "You do not have permission to perform this action.",
  },
  1004: {
    code: 1004,
    name: "AssetAlreadyAdded",
    apiCode: "ASSET_ALREADY_ADDED",
    userMessage: "This asset has already been added to your wallet.",
  },
  1005: {
    code: 1005,
    name: "AssetNotFound",
    apiCode: "ASSET_NOT_FOUND",
    userMessage: "The specified asset was not found in your wallet.",
  },
  1006: {
    code: 1006,
    name: "InvalidSpendLimit",
    apiCode: "INVALID_SPEND_LIMIT",
    userMessage: "The spend limit amount provided is invalid.",
  },
  1007: {
    code: 1007,
    name: "SpendLimitExceeded",
    apiCode: "SPEND_LIMIT_EXCEEDED",
    userMessage: "Payment would exceed your configured daily spend limit for this asset.",
  },
  1008: {
    code: 1008,
    name: "NoAssetsProvided",
    apiCode: "NO_ASSETS_PROVIDED",
    userMessage: "No assets were provided for this operation.",
  },
  1009: {
    code: 1009,
    name: "NoPendingAdmin",
    apiCode: "NO_PENDING_ADMIN",
    userMessage: "There is no pending admin transfer to accept.",
  },
  1010: {
    code: 1010,
    name: "SpendOverflow",
    apiCode: "SPEND_OVERFLOW",
    userMessage: "The transaction amount caused a numeric overflow.",
  },
  1011: {
    code: 1011,
    name: "AssetLimitExceeded",
    apiCode: "ASSET_LIMIT_EXCEEDED",
    userMessage: "The asset limit has been exceeded.",
  },
  1012: {
    code: 1012,
    name: "MaxAssetsReached",
    apiCode: "MAX_ASSETS_REACHED",
    userMessage: "You have reached the maximum number of assets permitted in this wallet.",
  },
  1013: {
    code: 1013,
    name: "UpgradeAlreadyPending",
    apiCode: "UPGRADE_ALREADY_PENDING",
    userMessage: "A contract upgrade proposal is already pending.",
  },
  1014: {
    code: 1014,
    name: "UpgradeNotPending",
    apiCode: "UPGRADE_NOT_PENDING",
    userMessage: "No contract upgrade is currently pending.",
  },
  1015: {
    code: 1015,
    name: "UpgradeHashMismatch",
    apiCode: "UPGRADE_HASH_MISMATCH",
    userMessage: "The upgrade hash does not match the proposed upgrade.",
  },
  1016: {
    code: 1016,
    name: "UpgradeNotReady",
    apiCode: "UPGRADE_NOT_READY",
    userMessage: "The required timelock delay for this upgrade has not elapsed yet.",
  },
  1017: {
    code: 1017,
    name: "UpgradeFailed",
    apiCode: "UPGRADE_FAILED",
    userMessage: "The contract upgrade failed to execute.",
  },
  1018: {
    code: 1018,
    name: "GuardianAlreadyAdded",
    apiCode: "GUARDIAN_ALREADY_ADDED",
    userMessage: "This guardian address is already registered.",
  },
  1019: {
    code: 1019,
    name: "GuardianNotFound",
    apiCode: "GUARDIAN_NOT_FOUND",
    userMessage: "The specified address is not a registered guardian.",
  },
  1020: {
    code: 1020,
    name: "InvalidRecoveryThreshold",
    apiCode: "INVALID_RECOVERY_THRESHOLD",
    userMessage: "The recovery threshold must be greater than 1 and no more than the total number of guardians.",
  },
  1021: {
    code: 1021,
    name: "NotEnoughGuardians",
    apiCode: "NOT_ENOUGH_GUARDIANS",
    userMessage: "There are not enough guardians configured to support this recovery threshold.",
  },
  1022: {
    code: 1022,
    name: "RecoveryNotConfigured",
    apiCode: "RECOVERY_NOT_CONFIGURED",
    userMessage: "Social recovery has not been configured on this wallet yet.",
  },
  1023: {
    code: 1023,
    name: "RecoveryAlreadyPending",
    apiCode: "RECOVERY_ALREADY_PENDING",
    userMessage: "A social recovery proposal is already in progress.",
  },
  1024: {
    code: 1024,
    name: "NoPendingRecovery",
    apiCode: "NO_PENDING_RECOVERY",
    userMessage: "There is no pending social recovery proposal to act upon.",
  },
  1025: {
    code: 1025,
    name: "AlreadyApproved",
    apiCode: "ALREADY_APPROVED",
    userMessage: "You have already approved this recovery proposal.",
  },
  1026: {
    code: 1026,
    name: "ApprovalNotFound",
    apiCode: "APPROVAL_NOT_FOUND",
    userMessage: "No approval found from this guardian to revoke.",
  },
  1027: {
    code: 1027,
    name: "RecoveryNotReady",
    apiCode: "RECOVERY_NOT_READY",
    userMessage: "The recovery timelock delay has not yet passed.",
  },
  1028: {
    code: 1028,
    name: "RecoveryNotQuorate",
    apiCode: "RECOVERY_NOT_QUORATE",
    userMessage: "Recovery approvals have dropped below the required threshold quorum.",
  },
  1029: {
    code: 1029,
    name: "InvalidAssetInfo",
    apiCode: "INVALID_ASSET_INFO",
    userMessage: "The asset code or issuer configuration is invalid.",
  },
  1030: {
    code: 1030,
    name: "UpgradeWasmNotUploaded",
    apiCode: "UPGRADE_WASM_NOT_UPLOADED",
    userMessage: "The proposed contract WASM has not been uploaded to the network.",
  },
  1031: {
    code: 1031,
    name: "GuardianLimitExceeded",
    apiCode: "GUARDIAN_LIMIT_EXCEEDED",
    userMessage: "You have reached the maximum number of guardians allowed.",
  },
  1032: {
    code: 1032,
    name: "RecoveryNewAdminUnchanged",
    apiCode: "RECOVERY_NEW_ADMIN_UNCHANGED",
    userMessage: "The proposed recovery address is already the current wallet admin.",
  },
  1033: {
    code: 1033,
    name: "InvalidAssetCode",
    apiCode: "INVALID_ASSET_CODE",
    userMessage: "Asset code cannot be empty and cannot exceed maximum allowed length.",
  },
  1034: {
    code: 1034,
    name: "TokenNotAllowed",
    apiCode: "TOKEN_NOT_ALLOWED",
    userMessage: "This token is not on the admin-approved allowlist for transfers.",
  },
  1035: {
    code: 1035,
    name: "TokenWrapperNotSet",
    apiCode: "TOKEN_WRAPPER_NOT_SET",
    userMessage: "Token wrapper contract instance has not been configured by an admin.",
  },
  1036: {
    code: 1036,
    name: "TokenTransferFailed",
    apiCode: "TOKEN_TRANSFER_FAILED",
    userMessage: "The token transfer failed. Please check allowance and account balance.",
  },
  1037: {
    code: 1037,
    name: "UpgradeDelayTooShort",
    apiCode: "UPGRADE_DELAY_TOO_SHORT",
    userMessage: "The proposed upgrade timelock delay is below the minimum required ledgers.",
  },
  1038: {
    code: 1038,
    name: "RecoveryDelayTooShort",
    apiCode: "RECOVERY_DELAY_TOO_SHORT",
    userMessage: "The recovery timelock delay is below the minimum required ledgers.",
  },

  // Backward compatibility aliases for legacy single-digit codes (9..28)
  9: { code: 1009, name: "NoPendingAdmin", apiCode: "NO_PENDING_ADMIN", userMessage: "There is no pending admin transfer to accept." },
  10: { code: 1010, name: "SpendOverflow", apiCode: "SPEND_OVERFLOW", userMessage: "The transaction amount caused a numeric overflow." },
  11: { code: 1011, name: "AssetLimitExceeded", apiCode: "ASSET_LIMIT_EXCEEDED", userMessage: "The asset limit has been exceeded." },
  12: { code: 1012, name: "MaxAssetsReached", apiCode: "MAX_ASSETS_REACHED", userMessage: "You have reached the maximum number of assets permitted in this wallet." },
  13: { code: 1013, name: "UpgradeAlreadyPending", apiCode: "UPGRADE_ALREADY_PENDING", userMessage: "A contract upgrade proposal is already pending." },
  14: { code: 1014, name: "UpgradeNotPending", apiCode: "UPGRADE_NOT_PENDING", userMessage: "No contract upgrade is currently pending." },
  15: { code: 1015, name: "UpgradeHashMismatch", apiCode: "UPGRADE_HASH_MISMATCH", userMessage: "The upgrade hash does not match the proposed upgrade." },
  16: { code: 1016, name: "UpgradeNotReady", apiCode: "UPGRADE_NOT_READY", userMessage: "The required timelock delay for this upgrade has not elapsed yet." },
  17: { code: 1017, name: "UpgradeFailed", apiCode: "UPGRADE_FAILED", userMessage: "The contract upgrade failed to execute." },
  18: { code: 1018, name: "GuardianAlreadyAdded", apiCode: "GUARDIAN_ALREADY_ADDED", userMessage: "This guardian address is already registered." },
  19: { code: 1019, name: "GuardianNotFound", apiCode: "GUARDIAN_NOT_FOUND", userMessage: "The specified address is not a registered guardian." },
  20: { code: 1020, name: "InvalidRecoveryThreshold", apiCode: "INVALID_RECOVERY_THRESHOLD", userMessage: "The recovery threshold must be greater than 1 and no more than the total number of guardians." },
  21: { code: 1021, name: "NotEnoughGuardians", apiCode: "NOT_ENOUGH_GUARDIANS", userMessage: "There are not enough guardians configured to support this recovery threshold." },
  22: { code: 1022, name: "RecoveryNotConfigured", apiCode: "RECOVERY_NOT_CONFIGURED", userMessage: "Social recovery has not been configured on this wallet yet." },
  23: { code: 1023, name: "RecoveryAlreadyPending", apiCode: "RECOVERY_ALREADY_PENDING", userMessage: "A social recovery proposal is already in progress." },
  24: { code: 1024, name: "NoPendingRecovery", apiCode: "NO_PENDING_RECOVERY", userMessage: "There is no pending social recovery proposal to act upon." },
  25: { code: 1025, name: "AlreadyApproved", apiCode: "ALREADY_APPROVED", userMessage: "You have already approved this recovery proposal." },
  26: { code: 1026, name: "ApprovalNotFound", apiCode: "APPROVAL_NOT_FOUND", userMessage: "No approval found from this guardian to revoke." },
  27: { code: 1027, name: "RecoveryNotReady", apiCode: "RECOVERY_NOT_READY", userMessage: "The recovery timelock delay has not yet passed." },
  28: { code: 1028, name: "RecoveryNotQuorate", apiCode: "RECOVERY_NOT_QUORATE", userMessage: "Recovery approvals have dropped below the required threshold quorum." },
};

/**
 * Mapping of numeric error code to variant name.
 */
export const GLOBE_WALLET_ERROR_CODES: Readonly<Record<number, string>> = Object.fromEntries(
  Object.entries(GLOBE_WALLET_ERRORS).map(([code, info]) => [Number(code), info.name])
);

const CONTRACT_ERROR_PATTERN = /Error\(Contract,\s*#(\d+)\)/;

/**
 * Extracts a contract error code from a raw string or number.
 */
export function extractContractErrorCode(raw: string | number): number | null {
  if (typeof raw === "number") return raw;
  const match = raw.match(CONTRACT_ERROR_PATTERN);
  return match ? Number(match[1]) : null;
}

/**
 * Returns the human-readable user-facing UI message for a contract error code.
 */
export function getGlobeWalletUserMessage(codeOrRaw: number | string): string | null {
  const code = extractContractErrorCode(codeOrRaw);
  if (code === null) return null;
  return GLOBE_WALLET_ERRORS[code]?.userMessage ?? null;
}

/**
 * Returns the stable API error code string for a contract error code.
 */
export function getGlobeWalletApiCode(codeOrRaw: number | string): string | null {
  const code = extractContractErrorCode(codeOrRaw);
  if (code === null) return null;
  return GLOBE_WALLET_ERRORS[code]?.apiCode ?? null;
}

/**
 * Extracts a `Error(Contract, #N)` code from a raw Soroban simulation/
 * transaction error string and appends its `WalletError` name and user message, if known.
 * Falls back to returning the input unchanged when no such code is found.
 */
export function describeGlobeWalletError(raw: string): string {
  const code = extractContractErrorCode(raw);
  if (code === null) return raw;
  const info = GLOBE_WALLET_ERRORS[code];
  return info ? `${info.name} (contract error #${code}): ${info.userMessage}` : raw;
}

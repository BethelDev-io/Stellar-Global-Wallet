# GlobeWallet Smart Contract Events Audit

This document is the authoritative audit of all events emitted by the `globe-wallet` Soroban smart contract (`contracts/globe-wallet/src/lib.rs`).

Every state mutation in `GlobeWallet` emits at least one event with sufficient contextual data for external indexers, push-notification services, and activity feeds.

---

## Event Catalog

| Entrypoint / Mutator | Emitted Event Symbol | Topics | Data Payload | Description & Context |
|---|---|---|---|---|
| `initialize(admin)` | `"initialized"` | `("initialized",)` | `admin: Address` | Contract initialized with initial admin. |
| `propose_admin(current, candidate)` | `"admin_proposed"` | `("admin_proposed",)` | `(current: Address, candidate: Address)` | First step of admin rotation: admin proposes candidate. |
| `accept_admin(candidate)` | `"admin_transferred"` | `("admin_transferred",)` | `(old_admin: Address, new_admin: Address)` | Second step of admin rotation: candidate accepts admin. |
| `cancel_admin_transfer(current)` | `"admin_transfer_cancelled"` | `("admin_transfer_cancelled",)` | `current: Address` | Current admin cancels pending admin proposal. |
| `propose_upgrade(proposer, wasm_hash, delay)` | `"upgrade_proposed"` | `("upgrade_proposed",)` | `(proposer: Address, wasm_hash: BytesN<32>, ready_at: u32)` | Admin queues contract WASM upgrade with timelock delay. |
| `execute_upgrade(executor, wasm_hash)` | `"upgrade_executed"` | `("upgrade_executed",)` | `(executor: Address, wasm_hash: BytesN<32>)` | Timelocked upgrade executed after delay elapsed. |
| `add_guardian(admin, guardian)` | `"guardian_added"` | `("guardian_added",)` | `guardian: Address` | Guardian added to social recovery guardian set. |
| `remove_guardian(admin, guardian)` | `"guardian_removed"` | `("guardian_removed",)` | `guardian: Address` | Guardian removed from social recovery set. |
| `remove_guardian(admin, guardian)` (approval strip) | `"recovery_approval_invalidated"` | `("recovery_approval_invalidated",)` | `guardian: Address` | Emitted when removed guardian had an active approval on a pending recovery proposal. |
| `set_recovery_config(admin, threshold, delay)` | `"recovery_config_set"` | `("recovery_config_set",)` | `(threshold: u32, delay_in_ledgers: u32)` | Sets guardian threshold and timelock delay. |
| `initiate_recovery(guardian, new_admin)` | `"recovery_initiated"` | `("recovery_initiated",)` | `(guardian: Address, new_admin: Address)` | Guardian starts recovery proposal for lost admin key. |
| `approve_recovery(guardian)` | `"recovery_approved"` | `("recovery_approved",)` | `guardian: Address` | Guardian approves the active recovery proposal. |
| `approve_recovery(guardian)` (on quorum) | `"recovery_quorum_reached"` | `("recovery_quorum_reached",)` | `(new_admin: Address, ready_at: u32)` | Quorum threshold reached; timelock delay armed. |
| `revoke_recovery_approval(guardian)` | `"recovery_approval_revoked"` | `("recovery_approval_revoked",)` | `guardian: Address` | Guardian revokes their approval; disarms timelock if under threshold. |
| `execute_recovery()` | `"admin_transferred"` | `("admin_transferred",)` | `(old_admin: Address, new_admin: Address)` | Routine event for indexer backward compatibility. |
| `execute_recovery()` | `"recovery_completed"` | `("recovery_completed",)` | `RecoveryCompletedEvent { old_admin, new_admin, approving_guardians, executed_at }` | Security audit event carrying full recovery execution context. |
| `cancel_recovery(admin)` | `"recovery_cancelled"` | `("recovery_cancelled",)` | `admin: Address` | Current admin cancels pending recovery before execution. |
| `add_asset(user, asset)` | `"asset_added"` | `("asset_added",)` | `(user: Address, asset_code: String)` | User whitelists an asset in their wallet registry. |
| `remove_asset(user, asset_code)` | `"asset_removed"` | `("asset_removed",)` | `(user: Address, asset_code: String)` | User removes an asset from their wallet registry. |
| `set_spend_limit(user, asset_code, limit)` | `"spend_limit_set"` | `("spend_limit_set",)` | `(user: Address, asset_code: String, limit: i128)` | Sets or clears daily spend limit for an asset. |
| `record_spend(user, asset_code, amount)` | `"spend_recorded"` | `("spend_recorded",)` | `(user: Address, asset_code: String, amount: i128, new_spent: i128, limit: i128)` | Records spend against daily limit in current UTC bucket. |
| `set_token_wrapper(admin, token_wrapper_id)` | `"token_wrapper_set"` | `("token_wrapper_set",)` | `token_wrapper_id: Address` | Configures authorized token-wrapper contract ID. |
| `add_allowed_token(admin, token_id)` | `"token_allowed"` | `("token_allowed",)` | `token_id: Address` | Adds token to allowlist for wrapped transfers. |
| `remove_allowed_token(admin, token_id)` | `"token_disallowed"` | `("token_disallowed",)` | `token_id: Address` | Removes token from allowlist. |
| `send(user, token_id, asset_code, to, amount)` | `"send_executed"` | `("send_executed",)` | `(user: Address, token_id: Address, to: Address, amount: i128)` | Emitted when token transfer through wrapper succeeds. |
| `migrate_user_assets(admin, user)` | `"user_assets_migrated"` | `("user_assets_migrated",)` | `(user: Address, removed: u32)` | Trims user asset list to MAX_ASSETS if exceeded. |

---

## Consumer Guidance

1. **Activity Feed**: `send_executed`, `spend_limit_set`, `guardian_added`, `guardian_removed`, and recovery events feed into unified activity timelines alongside Horizon payment operations.
2. **Push Notifications**: High-security events (`recovery_initiated`, `guardian_added`, `recovery_completed`, `admin_proposed`) trigger immediate push alerts.
3. **Cache Invalidation**: Mutation events notify the backend cache layer (`sorobanCache.ts`) to bust cached contract query responses (`bustContractCache`).

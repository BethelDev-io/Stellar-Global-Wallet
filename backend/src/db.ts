import { Pool } from "pg";
import { config } from "./config";
import { ensureDevicesTable } from "./services/deviceRegistry";
import { ensureVerifiedEmailsTable } from "./services/emailVerification";

export const pool = new Pool({ connectionString: config.DATABASE_URL });

export async function ensureAuditTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS keypair_audit_log (
      id BIGSERIAL PRIMARY KEY,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      api_key_hash VARCHAR(64) NOT NULL,
      public_key VARCHAR(56) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source_public_key VARCHAR(56) NOT NULL,
      idempotency_key VARCHAR(255) NOT NULL,
      result_hash VARCHAR(64) NOT NULL,
      result_successful BOOLEAN NOT NULL,
      UNIQUE (source_public_key, idempotency_key)
    )
  `);

  // #87 — device token table for push notifications.
  await ensureDevicesTable(pool);

  // #90 — verified email table for email notification fallback.
  await ensureVerifiedEmailsTable(pool);

  // #67 — address book (saved contacts) per user.
  await ensureContactsTable(pool);

  // #68 — per-user preferences (currency, language, hidden assets, notifications).
  await ensurePreferencesTable(pool);
}

export async function ensureContactsTable(db: Pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id BIGSERIAL PRIMARY KEY,
      owner VARCHAR(255) NOT NULL,
      label VARCHAR(255) NOT NULL,
      address VARCHAR(255) NOT NULL,
      memo VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (owner, address)
    )
  `);
}

export async function ensurePreferencesTable(db: Pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS preferences (
      account VARCHAR(255) PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

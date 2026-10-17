/**
 * Thin i18n helpers for the backend service layer (#91, #92, #93).
 *
 * These wrappers load the catalogues from packages/i18n and expose the
 * same `tNotification` / `tError` API used in the notification workers,
 * keeping the catalogue in one place (packages/i18n) while remaining
 * importable from inside `backend/src/services/`.
 *
 * When additional locales ship, add their catalogue to packages/i18n and
 * update the `catalogues` map here — no other file needs to change.
 */

import errorsEn from "../../../packages/i18n/errors/en.json";
import notificationsEn from "../../../packages/i18n/notifications/en.json";

const errorCatalogues: Record<string, Record<string, string>> = {
  en: errorsEn as Record<string, string>,
};

const notificationCatalogues: Record<string, Record<string, string>> = {
  en: notificationsEn as Record<string, string>,
};

function interpolate(template: string, vars: Record<string, string> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match
  );
}

function resolve(
  catalogues: Record<string, Record<string, string>>,
  key: string,
  locale: string,
  vars?: Record<string, string>
): string {
  const base = locale.split("-")[0].toLowerCase();
  const catalogue = catalogues[base] ?? catalogues["en"] ?? {};
  const entry = catalogue[key] ?? key;
  return vars ? interpolate(entry, vars) : entry;
}

/** Translate a notification template key with optional ICU placeholders. */
export function tNotification(
  key: string,
  locale = "en",
  vars?: Record<string, string>
): string {
  return resolve(notificationCatalogues, key, locale, vars);
}

/** Translate an API error code key with optional ICU placeholders. */
export function tError(
  code: string,
  locale = "en",
  vars?: Record<string, string>
): string {
  return resolve(errorCatalogues, code, locale, vars);
}

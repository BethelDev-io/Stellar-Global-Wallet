/**
 * @globe-wallet/i18n
 *
 * Typed message catalogue for API error codes (#92) and notification
 * templates (#91) with ICU-style placeholder substitution.
 *
 * Usage:
 *   import { t, tError } from "@globe-wallet/i18n";
 *
 *   tError("VALIDATION_ERROR")
 *   // → "The request contains invalid or missing fields."
 *
 *   t("notifications", "payment.received.body", { amount: "10", asset: "XLM" })
 *   // → "You received 10 XLM"
 */

import errorsEn from "../errors/en.json";
import notificationsEn from "../notifications/en.json";

export type ErrorCatalogueKey = keyof typeof errorsEn;
export type NotificationCatalogueKey = keyof typeof notificationsEn;

export type Catalogue = "errors" | "notifications";

type CatalogueKey<C extends Catalogue> = C extends "errors"
  ? ErrorCatalogueKey
  : NotificationCatalogueKey;

const catalogues = {
  errors: errorsEn as Record<string, string>,
  notifications: notificationsEn as Record<string, string>,
};

/**
 * Substitute ICU-style `{placeholder}` tokens in a message string.
 * Unknown placeholders are left as-is so partial renders are still useful.
 */
function interpolate(template: string, vars: Record<string, string> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match
  );
}

/**
 * Translate a key from the given catalogue with optional placeholder values.
 * Falls back to the key itself when the catalogue entry is missing, so
 * callers never receive `undefined`.
 */
export function t<C extends Catalogue>(
  catalogue: C,
  key: CatalogueKey<C>,
  vars?: Record<string, string>
): string {
  const entry = catalogues[catalogue][key as string];
  if (entry === undefined) {
    return key as string;
  }
  return vars ? interpolate(entry, vars) : entry;
}

/**
 * Convenience wrapper for API error codes (#92).
 */
export function tError(code: string, vars?: Record<string, string>): string {
  const entry = catalogues.errors[code];
  if (entry === undefined) {
    return code;
  }
  return vars ? interpolate(entry, vars) : entry;
}

/**
 * Convenience wrapper for notification templates (#91).
 */
export function tNotification(key: string, vars?: Record<string, string>): string {
  const entry = catalogues.notifications[key];
  if (entry === undefined) {
    return key;
  }
  return vars ? interpolate(entry, vars) : entry;
}

export { errorsEn, notificationsEn };

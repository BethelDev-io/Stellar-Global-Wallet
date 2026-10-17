/**
 * Accept-Language middleware (#93).
 *
 * Parses the `Accept-Language` request header and attaches the resolved
 * BCP-47 locale to `req.locale` for use by downstream handlers (error
 * messages, email templates, CSV headers, etc.).
 *
 * Resolution order:
 *   1. Parsed locales from `Accept-Language` header (highest q-value first)
 *   2. Authenticated user's device locale (req.user populated by jwtAuth)
 *   3. Hard-coded fallback: "en"
 *
 * Only locales for which a catalogue exists in @globe-wallet/i18n are
 * considered; unknown locales are skipped and the fallback is used.
 *
 * Supported locales are intentionally kept as a small explicit set so that
 * the CI missing-key check (#92) can enforce completeness per locale rather
 * than having an open-ended list.
 */

import { Request, Response, NextFunction } from "express";

/** Locales for which a complete catalogue exists. */
export const SUPPORTED_LOCALES = ["en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const DEFAULT_LOCALE: SupportedLocale = "en";

/** Parses an Accept-Language header string into locale tags ordered by q-value. */
export function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.trim(), q: q !== undefined ? parseFloat(q) : 1.0 };
    })
    .sort((a, b) => b.q - a.q)
    .map(({ tag }) => tag);
}

/** Normalises a locale tag to its base language ("en-US" → "en"). */
function baseLocale(tag: string): string {
  return tag.split("-")[0].toLowerCase();
}

/** Returns the best supported locale given an ordered preference list. */
export function resolveLocale(candidates: string[]): SupportedLocale {
  for (const candidate of candidates) {
    const base = baseLocale(candidate) as SupportedLocale;
    if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) {
      return base;
    }
  }
  return DEFAULT_LOCALE;
}

/**
 * Express middleware: resolves req.locale from Accept-Language then falls
 * back through device locale and finally "en".
 */
export function localeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const candidates: string[] = [];

  const acceptHeader = req.headers["accept-language"];
  if (acceptHeader) {
    candidates.push(...parseAcceptLanguage(acceptHeader));
  }

  // Fallback to the locale stored on the authenticated user's device record,
  // if jwtAuth has already run and the user object is present.
  const deviceLocale = (req as Request & { user?: { locale?: string } }).user?.locale;
  if (deviceLocale) {
    candidates.push(deviceLocale);
  }

  req.locale = resolveLocale(candidates);
  next();
}

// Augment Express Request to carry the resolved locale.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      locale: SupportedLocale;
    }
  }
}

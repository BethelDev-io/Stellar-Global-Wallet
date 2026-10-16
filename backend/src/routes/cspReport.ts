import express, { Router } from "express";
import { rateLimit } from "express-rate-limit";

export const cspReportRouter = Router();

// Dedicated, tighter rate limit for this route (mirrors the pattern in
// routes/auth.ts's loginLimiter). Reports arrive unauthenticated, directly
// from browsers enforcing the policy, not from our own clients — the
// global limiter in app.ts (100 req / 15 min) is sized for authenticated
// API traffic, not an extension/bot repeatedly hammering a public
// report-only endpoint. A real browser reporting genuine violations for
// one page load sends at most a handful of reports; a much higher budget
// than the global limit still bounds the worst case (log spam / disk
// pressure) without false-positiving on a page with several distinct
// violations.
const cspReportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many CSP reports, please try again later", code: "CSP_REPORT_RATE_LIMITED" },
});

// Browsers POST CSP violation reports as `application/csp-report` (the
// older `report-uri` directive) or `application/reports+json` (the newer
// Reporting API's `report-to`), never as plain `application/json` — the
// global `express.json()` in app.ts (type-restricted to `application/json`
// by default) would silently skip parsing these and leave req.body `{}`.
// Accepting the extra content types here, scoped to just this route, is
// the same per-route `express.json()` override pattern used for the
// larger XDR body limit on /wallet/fee-bump and /wallet/submit-multisig.
const cspReportBodyParser = express.json({
  type: ["application/json", "application/csp-report", "application/reports+json"],
  limit: "64kb",
});

interface LegacyCspReport {
  "csp-report"?: Record<string, unknown>;
}

type ReportingApiEntry = {
  type?: string;
  url?: string;
  body?: Record<string, unknown>;
};

/**
 * Normalizes either report shape into a flat list of violation payloads
 * for logging, so callers don't need to branch on which directive
 * produced the request.
 */
function extractViolations(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    // Reporting API (`report-to`): an array of reports, only some of
    // which may be CSP violations (the browser can batch other report
    // types — e.g. deprecation, intervention — through the same endpoint).
    return (body as ReportingApiEntry[])
      .filter((entry) => entry?.type === "csp-violation" && entry.body)
      .map((entry) => ({ url: entry.url, ...entry.body }));
  }

  if (body && typeof body === "object" && "csp-report" in body) {
    // Legacy `report-uri`: a single object wrapping the violation.
    const legacy = (body as LegacyCspReport)["csp-report"];
    return legacy ? [legacy] : [];
  }

  return [];
}

cspReportRouter.post("/", cspReportLimiter, cspReportBodyParser, (req, res) => {
  const violations = extractViolations(req.body);

  for (const violation of violations) {
    // Structured, single-line log per violation so this is grep/parse
    // friendly in aggregated logs. CSP reports only ever contain URLs and
    // directive names — no user input, cookies, or secrets — so this is
    // safe to log at the level every other request already is (morgan
    // logs the request line for this route too).
    console.warn("[csp-report]", JSON.stringify(violation));
  }

  // Report-only endpoints have nothing useful to return; 204 is what both
  // the `report-uri` and Reporting API specs expect on success.
  res.status(204).end();
});

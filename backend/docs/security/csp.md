# Content-Security-Policy for the future web app

## Why this matters

There is no web frontend in this repository yet — this backend currently
serves only the `/api/v1/*` JSON API consumed by a future web/mobile client
(see the root `HACKMD.md` and `README.md` contribution areas). A strict CSP
is one of the most effective XSS mitigations available to that client, and
the origins it needs to allow are determined by *this* backend's config
(`src/config.ts`), so it's decided here, once, rather than guessed at
independently whenever the web app is actually built.

If you're new to CSP: it's a response header (or `<meta>` tag) that tells
the browser which sources of scripts, styles, connections, frames, etc. a
page is allowed to load from. Anything not explicitly allowed is blocked,
even if an attacker manages to inject it into the page (e.g. via a stored
XSS in a username or memo field). See [MDN: Content Security
Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) for the full
directive reference.

## Threat model

**Attacker:** someone who can get arbitrary HTML/JS to render in the wallet
web app's origin — e.g. via a stored XSS in user-controlled data that the
app later renders unescaped (a transaction memo, an account name), or a
compromised third-party script.

**What they can do today, with no CSP:** run arbitrary JavaScript in the
page. For a wallet UI, that is complete compromise of the session — reading
whatever Stellar secret keys, JWTs, or signed transactions pass through
page memory or `localStorage`, redirecting the user to a phishing page that
looks identical, or silently rewriting an outgoing payment's destination
before the user signs it.

**What a strict CSP closes:** even if an attacker gets a `<script>` tag or
inline handler into the page, `script-src` with no `'unsafe-inline'`
support (nonces only — see below) stops it from executing. Even if it
executes, `connect-src` stops it from exfiltrating data anywhere except the
origins this document explicitly allows. `frame-ancestors 'none'` stops the
whole app from being iframed for a clickjacking attack over a signing
screen.

## Recommended policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-<per-request-nonce>';
  style-src 'self' 'nonce-<per-request-nonce>';
  img-src 'self' data:;
  connect-src 'self'
    https://horizon-testnet.stellar.org https://horizon.stellar.org
    https://soroban-testnet.stellar.org https://soroban-rpc.stellar.org
    wss://relay.walletconnect.com wss://relay.walletconnect.org
    <this API's own origin, e.g. https://api.yourapp.example>;
  frame-src 'none';
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  report-to csp-endpoint;
  report-uri /csp-report;
```

Paired `Reporting-Endpoints` / `Report-To` header (for the `report-to`
directive above — `report-uri` is the older, still-widely-supported
fallback and both can be sent together):

```
Reporting-Endpoints: csp-endpoint="/csp-report"
```

### Why each origin is on the list

These map directly to `src/config.ts`, so when an environment changes one
of these URLs, the CSP has to change with it (see "Keeping this in sync"
below) — the policy is a function of the backend's own configured network
endpoints, not a fixed list:

- **`connect-src` → Horizon** (`HORIZON_URL`): the web app talks to Horizon
  directly for some reads (account/balance polling) in addition to going
  through this API.
- **`connect-src` → Soroban RPC** (`SOROBAN_RPC_URL`): same reasoning, for
  contract simulation/reads against the deployed `GLOBE_WALLET_CONTRACT_ID`
  (see `docs/soroban-integration.md`).
- **`connect-src` → this API's own origin**: every `/api/v1/*` call.
- **`connect-src` → WalletConnect relays**: if/when the web app integrates
  [Stellar Wallets Kit](https://stellarwalletskit.dev/) or another
  WalletConnect-based signer so users can sign with Lobstr/xBull/etc.
  instead of handing a raw secret key to this backend (see
  `docs/security-model.md`'s "future migration path toward client-side
  signing") — the relay is where the wallet and dApp exchange signed
  payloads over a websocket.
- **No `unsafe-inline`, nonces instead**: the two secret-key-handling
  threats documented in `docs/security-model.md` (process memory exposure,
  accidental logging) are about the backend; this is the equivalent
  decision for the frontend — inline scripts/styles are exactly the
  injection vector CSP exists to close, so the app's build must emit a
  fresh per-request nonce (most SSR frameworks — Next.js, Remix, etc. —
  have built-in support for this) rather than relaxing `script-src` to
  allow them.

### Why not a wildcard / `'unsafe-inline'` shortcut

It's tempting to ship `script-src 'self' 'unsafe-inline'` to avoid wiring
up nonces, or `connect-src *` to avoid maintaining this list. Both defeat
the point: `'unsafe-inline'` means the *exact* injected-script attack this
doc opens with is no longer blocked, and `connect-src *` means a
compromised dependency can exfiltrate wallet data to any attacker-owned
host. Treat both as explicitly out of bounds, not a future relaxation.

## Reporting

`POST /csp-report` (see `src/routes/cspReport.ts`) accepts both the legacy
`report-uri` shape (`application/csp-report`, body
`{ "csp-report": {...} }`) and the newer Reporting API shape
(`application/reports+json`, a JSON array of report objects) and logs each
violation. It has its own rate limit (60/min/IP) separate from the global
API limiter, since reports arrive unauthenticated directly from browsers
enforcing the policy — not from this API's own clients — and a
misconfigured policy on a popular page could otherwise generate far more
traffic than a normal API caller would.

Reports are logged, not stored — there's no database table for them. If
violation volume ever needs dashboards/alerting rather than log-grepping,
that's a deliberate follow-up (storage schema, retention, alerting
thresholds), not something to bolt on silently here.

## Keeping this in sync

This document can drift from the real deployed policy the moment either
changes independently. Treat it as the source of truth and update it
*before* changing the policy. `config.ts`'s `GLOBE_WALLET_CONTRACT_ID`,
`HORIZON_URL`, and `SOROBAN_RPC_URL` comments already point back to the
docs that must stay consistent with them (`docs/concurrency.md`,
`docs/soroban-integration.md`) — this file joins that set.

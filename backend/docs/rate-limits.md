# Rate limits and client backoff (issue #125)

## Limits in effect today

| Scope | Limit | Window | Where configured |
|---|---|---|---|
| Every route (including `/health`) | 100 requests | 15 minutes, per client IP | [`src/app.ts`](../src/app.ts) |
| `POST /api/v1/auth/login` specifically | 10 requests | 15 minutes, per client IP, **on top of** the global limit above | [`src/routes/auth.ts`](../src/routes/auth.ts) |

Both limiters key on client IP as resolved by Express's `trust proxy`
setting (`TRUST_PROXY_HOPS` — see [`docs/concurrency.md`](./concurrency.md)
and issue #90). Behind a misconfigured number of proxy hops, unrelated
clients can be pooled into one bucket or a client can spoof its way out of
one — this is a deployment-topology concern, not something a client-side
integration can work around, so it's out of scope here.

## Headers every response carries

Both limiters are configured with `standardHeaders: true` /
`legacyHeaders: false` (`express-rate-limit`), which emits the
[IETF `RateLimit-*` draft](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)
headers, not the older non-standard `X-RateLimit-*` ones:

| Header | Meaning |
|---|---|
| `RateLimit-Limit` | Total requests allowed in the current window |
| `RateLimit-Remaining` | Requests left in the current window |
| `RateLimit-Reset` | Seconds until the window resets |

On a `429`, the response additionally carries a `Retry-After` header
(seconds) — prefer this over re-deriving a wait time from `RateLimit-Reset`
when it's present, since it's the value the server actually intends for
backoff.

The response body on `429` follows the same error envelope as every other
error (see [`docs/error-examples.md`](./error-examples.md)):

```json
{ "code": "LOGIN_RATE_LIMITED", "error": "Too many login attempts, please try again later" }
```

(the global limiter's `429` uses `express-rate-limit`'s own default body
rather than a custom `code`/`error` pair — if you need a stable code to
branch on for the global limit specifically, treat the bare `429` status
itself as that signal today.)

## Recommended client backoff

1. **Read `RateLimit-Remaining` proactively.** A well-behaved client should
   slow down before hitting `0`, not only react to a `429` after the fact.
2. **On `429`, wait at least `Retry-After` seconds** before retrying the
   same request. Do not retry immediately or in a tight loop.
3. **Use exponential backoff with jitter for repeated `429`s** (e.g.
   `min(cap, base * 2^attempt) + random_jitter`), rather than retrying at a
   fixed interval — a fixed interval across many clients converges into a
   thundering herd right at the window boundary.
4. **Treat `503` (`retryable: true` responses, e.g. `LOCK_TIMEOUT` /
   `SEQUENCE_CONFLICT`) the same way** — these are transient and
   explicitly marked safe to retry, but still deserve backoff rather than
   an immediate retry.
5. **Never retry a `4xx` that isn't `429`** (e.g. `400`/`401`/`404`) — those
   indicate the request itself needs to change, and retrying unchanged
   just repeats the same failure while consuming more of the rate budget.

## SDK

This repo does not have a client SDK package yet — `frontend/` and
`mobile/` are not started (see the root
[README](../../README.md#%EF%B8%8F-architecture)), so there is nowhere to
link this from in an SDK README today. The guidance above is written so it
can be copied into that SDK's README once it exists; until then, this
document is the canonical reference, and the root
[`CONTRIBUTING.md`](../../CONTRIBUTING.md) points new frontend contributors
here.

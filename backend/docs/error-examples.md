# Error response examples (issue #124)

Every error this API returns uses one envelope, produced by
[`src/middleware/errorHandler.ts`](../src/middleware/errorHandler.ts):

```json
{
  "code": "VALIDATION_ERROR",
  "error": "Request validation failed",
  "details": [ /* optional, shape depends on code */ ],
  "retryable": false /* optional, only present when meaningful */
}
```

`code` is the stable, machine-readable identifier integrators should branch
on — it does not change even if the human-readable `error` message's
wording does. `retryable` is only present on errors where it's meaningful
(Horizon/Soroban transients); its absence does **not** mean "not
retryable," it means "not evaluated" — check for Horizon's own `409`
(sequence conflicts) and `503` (lock/upstream unavailability) codes
explicitly if you need that distinction today.

## Example bodies for every status code

[`docs/openapi-errors.yaml`](./openapi-errors.yaml) has a worked example for
each of 400, 401, 403, 404, 409, 413, 429, 500, and 503, each one taken from
(or shaped exactly like) a real error class in
[`src/errors/appError.ts`](../src/errors/appError.ts),
[`src/services/stellarErrors.ts`](../src/services/stellarErrors.ts), and
[`src/services/sorobanErrors.ts`](../src/services/sorobanErrors.ts) — not
invented placeholders. The one exception is `403`, which no route returns
yet (there's no role-based authorization — every caller shares one API-key
identity); that example is forward scaffolding so the shape is fixed before
any route starts using it.

**Scope note:** this repo does not yet have a full OpenAPI document for
`/api/v1` (tracked separately in issue #15). `openapi-errors.yaml` is
written as a standalone `components` fragment so it merges straight in via
`$ref` once that spec exists, and so a mock server can serve the examples
today without waiting on it.

## Serving these from a mock server

Once a full OpenAPI document exists ([#15](https://github.com/Genghis-codes/Stellar-Global-Wallet/issues/15)) with these examples wired into each
route's response definitions, [Prism](https://github.com/stoplightio/prism)
can serve any named example instead of the default one via the `Prefer`
header:

```bash
# Default example for the route (usually the success case)
curl http://localhost:4010/api/v1/wallet/send

# Force the 429 example documented above
curl http://localhost:4010/api/v1/wallet/send \
  -H 'Prefer: example=TooManyRequests429'
```

The example name after `example=` matches the key under
`components.examples` in `openapi-errors.yaml` (e.g. `TooManyRequests429`,
`NotFound404`), which Prism looks up once a route's OpenAPI operation
references it:

```yaml
responses:
  "429":
    content:
      application/json:
        examples:
          TooManyRequests429:
            $ref: "./openapi-errors.yaml#/components/examples/TooManyRequests429"
```

This lets a frontend integration test or a manual Postman/curl check force
any error path without having to actually trigger it against the real API
(e.g. without sending 100+ requests to trip the rate limiter for real).

See [docs/rate-limits.md](./rate-limits.md) for how `429` responses and
their headers behave against the real (non-mocked) API.

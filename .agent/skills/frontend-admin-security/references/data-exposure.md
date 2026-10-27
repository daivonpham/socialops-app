# Secrets and data exposure

## Anything bundled is public

`VITE_*`, `NEXT_PUBLIC_*`, and every value imported into client code ships to the
browser and is readable in DevTools.

```text
✓ API base URL, feature flags, public keys, Sentry DSN
✗ API secrets, DB strings, private keys, admin tokens, signing secrets
✗ "Temporary" credentials for a demo environment
```

If a value must stay secret, it belongs behind a backend endpoint — not in an env
variable with a public prefix.

Check before shipping: search the built bundle for known secret prefixes.

## Query cache holds real data

The TanStack Query cache is plain memory holding API responses, including PII.

- `queryClient.clear()` on logout (see `auth-session.md`)
- Do not persist the query cache to `localStorage` unless you have reviewed exactly
  which queries are persisted
- Include tenant/role in query keys when the same endpoint returns different data
  per scope, otherwise a role switch can serve the previous scope's cached rows

## Logging and error reporting

Sentry and similar tools capture breadcrumbs, request bodies, and state by default.

```text
✗ console.log of full API responses left in production code
✗ Sending request/response bodies to the error reporter unfiltered
✗ Putting tokens, emails, phone numbers, or ID numbers in error messages
✓ Log identifiers (order id, correlation id) instead of payloads
✓ Configure beforeSend to scrub auth headers and known PII fields
```

Session replay tools must have masking enabled for inputs and tables — an admin
replay otherwise records customer data at full fidelity.

## Fetching more than you display

Hiding a column does not stop the field from arriving:

```text
The value is in the network tab, in the query cache, and in any error report.
```

Ask the backend for a scoped response, or accept that the field is visible to
anyone who can open DevTools.

Same for pagination: never fetch the full dataset and paginate client-side when
part of it is out of the user's scope.

## Browser storage

Only non-sensitive UI preferences (theme, column widths, page size). Version the
keys and keep values small. Never store tokens, permissions, or user records.

## Dependencies

Admin apps run privileged sessions, so a compromised package is a full compromise.

- Run `npm audit` / `pnpm audit` in CI and fix high severity
- Pin versions with a lockfile; review lockfile diffs in PRs
- Be skeptical of new low-download packages, especially anything touching auth,
  HTML rendering, or upload

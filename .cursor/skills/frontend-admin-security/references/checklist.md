# Security checklist

## Any feature touching data

```text
[ ] Backend authorizes every new endpoint (not just the UI guard)
[ ] Permission keys match the server's names
[ ] Response contains only fields the user may see
[ ] Query key includes tenant/role scope when the response varies by scope
```

## Auth changes

```text
[ ] Refresh token in httpOnly cookie (or accepted risk recorded)
[ ] Access token not persisted to localStorage
[ ] CSRF token sent on state-changing requests when using cookie auth
[ ] Single-flight refresh; capped retries
[ ] Logout clears server session + query cache + stores
```

## Rendering

```text
[ ] No new dangerouslySetInnerHTML outside the shared SafeHtml helper
[ ] User/API supplied href and src validated to http(s)
[ ] target="_blank" has rel="noopener noreferrer"
[ ] Redirect params restricted to same-origin paths
```

## Exposure

```text
[ ] No secret in VITE_*/NEXT_PUBLIC_* or bundled config
[ ] No console.log of API payloads left behind
[ ] Error reporter scrubs auth headers and PII
[ ] Session replay masks inputs and tables
[ ] Browser storage holds UI prefs only
```

## Third-party OAuth (Facebook/TikTok/etc.)

```text
[ ] Authorize URL built server-side; frontend never holds client id/secret
[ ] OAuth callback lands on a backend route, not a frontend one
[ ] No third-party access/refresh token in localStorage/cookies/Query cache
[ ] Reconnect flow re-runs the backend-owned OAuth flow, not a client-only retry
[ ] OAuth `code`/`state`/callback URL excluded from logs and error reporting
```

## Upload

```text
[ ] Client checks present for UX; server validation confirmed
[ ] Filename not used as a path; escaped when displayed
[ ] Uploaded SVG/HTML not rendered inline in the app origin
[ ] Download links authorized per request
```

## Reporting

State explicitly which items depend on backend work, so the reviewer can see what
the frontend is trusting.

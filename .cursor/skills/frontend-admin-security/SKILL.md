---
name: frontend-admin-security
description: >-
  Frontend security rules for admin apps: token/session storage, why client RBAC
  is UX only, XSS and open redirect, secrets and PII exposure (bundle, query
  cache, logs), and upload safety. Use when implementing or reviewing auth,
  permissions, route guards, HTML rendering, file upload, error reporting, or
  env variables. Triggers on "auth", "token", "permission", "RBAC", "XSS",
  "redirect", "secret", "PII", "security review".
license: MIT
metadata:
  author: local
  version: "1.0.0"
---

# Frontend Admin Security

Security layer for `frontend-admin-architecture`. Admin apps hold the highest
privileges in a system, so frontend mistakes here are expensive.

## The rule that matters most

```
Client-side permission checks are UX, never security.
Every action must be authorized again on the server.
```

Hiding a Delete button, guarding a route, and filtering a menu only shape what a
user *sees*. Anyone can call the API directly. If the backend does not re-check,
the feature is unprotected regardless of how correct the frontend looks.

## When to Apply

- Implementing or reviewing login, refresh, logout, route guards
- Adding permission keys, `Can()` checks, menu filtering
- Rendering server-provided HTML or user text
- Handling redirects after login
- Adding env variables, logging, or error reporting
- Building upload flows
- Connecting a third-party account (Facebook, TikTok, Google, Slack, …) via OAuth



## How It Works

1. Classify the change: auth/session, authorization, rendering, data exposure, upload.
2. Read the matching reference below.
3. Apply the rule; if it needs backend support, say so explicitly in the PR.
4. Run the checklist before finishing.



## References


| Area                                        | Reference                                                          |
| ------------------------------------------- | ------------------------------------------------------------------ |
| Token storage, refresh, logout, multi-tab   | [references/auth-session.md](references/auth-session.md)           |
| RBAC/PBAC boundaries, guards, menu          | [references/authorization.md](references/authorization.md)         |
| XSS, HTML rendering, open redirect, URLs    | [references/xss-and-redirects.md](references/xss-and-redirects.md) |
| Secrets in bundle, PII in cache/logs/Sentry | [references/data-exposure.md](references/data-exposure.md)         |
| File upload safety                          | [references/upload-security.md](references/upload-security.md)     |
| Third-party OAuth (Facebook/TikTok/etc.)    | [references/third-party-oauth.md](references/third-party-oauth.md) |
| Pre-merge checklist                         | [references/checklist.md](references/checklist.md)                 |




## Hard bans

```text
✗ Treating a hidden button or route guard as an authorization control
✗ Storing long-lived refresh tokens in localStorage
✗ dangerouslySetInnerHTML on unsanitized server or user content
✗ Redirecting to a raw ?returnUrl / ?redirect value
✗ Any secret in VITE_* / NEXT_PUBLIC_* / bundled config
✗ Sending request/response bodies wholesale to logging or error reporting
✗ Trusting file extension or client-reported MIME type
✗ A third-party (Facebook/TikTok/…) access or refresh token ever reaching the browser
```



## Output

When reporting, state which security areas the change touches, what was applied,
and any backend enforcement the frontend is depending on.
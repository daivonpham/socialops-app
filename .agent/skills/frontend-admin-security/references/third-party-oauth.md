# Connecting third-party accounts (OAuth)

Applies to any "connect your Facebook / TikTok / Google / Slack account" flow.
This is authorization delegated to a third party — a different, stricter case
than this app's own login (`auth-session.md`).

## The rule that matters most

```text
The third party's access/refresh token never reaches the browser.
The frontend only ever sees a connection status, never the token.
```

The backend owns the OAuth client id/secret, the redirect/callback, the code
exchange, and the token storage. The frontend's job is to start the flow and
display the result — nothing else.

## Flow

1. Frontend calls a backend endpoint to start the connection
   (`POST /social-accounts/connect/facebook`) and either redirects the browser
   to the authorize URL the backend returns, or opens it in a popup.
2. The third party redirects back to a **backend** callback URL, not a
   frontend route. The backend exchanges the code for tokens and stores them
   server-side.
3. The backend redirects/`postMessage`s the frontend back with a minimal
   result: `{ accountId, status: 'connected' | 'failed' }` — no token, no code.
4. Frontend re-fetches (or receives) the account's status from an
   authenticated endpoint and renders it. Treat the redirect/message payload
   itself as a hint to refetch, not as the source of truth.

```text
✗ Building the authorize URL (client_id, redirect_uri, scope) in frontend code
✗ A frontend route that receives the OAuth `code` and forwards it to the API
  from client JS (send users through a backend-owned callback instead)
✗ Trusting a `?connected=true` redirect query param without confirming via an
  authenticated status endpoint
```

## Token health / reconnect

The platform (Facebook, TikTok, …) can revoke or expire access outside the
app's control. The backend detects this (e.g. a publish call fails with an
auth error) and flips the account's status; the frontend only reads that
status field:

```ts
type SocialAccountStatus = 'connected' | 'expired' | 'revoked' | 'disconnected'
```

- Show a clear "Reconnect" action when status is not `connected`; do not
  silently keep scheduling/publishing to an account in this state.
- Reconnect reuses the same flow, scoped to that specific account id (the
  backend encodes/validates this in the OAuth `state` param — do not invent a
  client-side equivalent).
- Never attempt to refresh a third-party token from the browser, even if the
  platform's SDK makes it technically possible.

## Scopes

Display granted scopes as read-only info from the backend (e.g. "can post,
cannot read insights"). Do not let the frontend request additional or
different scopes than what the backend's OAuth app is configured for — scope
selection is a backend/product decision, not a per-click frontend option.

## Logging

Do not log the OAuth `code`, `state`, or the full callback URL to analytics or
error reporting — see `data-exposure.md`. A leaked `code` is briefly as
dangerous as a leaked token.

## Hard bans

```text
✗ Storing a Facebook/TikTok access or refresh token in localStorage,
  sessionStorage, cookies, Redux, or the Query cache
✗ Calling Facebook/TikTok/Graph APIs directly from the browser with a token
  the backend handed to the client "just this once"
✗ A "reconnect" flow that skips the backend and re-runs client-side OAuth
```

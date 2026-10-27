# Auth & session

## Token storage

| Storage                                    | XSS risk                       | CSRF risk          | Use for                             |
| ------------------------------------------ | ------------------------------ | ------------------ | ----------------------------------- |
| `httpOnly` + `Secure` + `SameSite` cookie  | Not readable by JS             | Needs CSRF defense | Refresh token / session (preferred) |
| In-memory (module variable, not persisted) | Lost on XSS only while running | None               | Short-lived access token            |
| `localStorage` / `sessionStorage`          | Readable by any XSS            | None               | Non-sensitive UI prefs only         |

Default for admin: **refresh token in `httpOnly` cookie, access token in memory**.

Long-lived tokens in `localStorage` mean a single XSS anywhere in the app — including
a third-party script — gives a permanent admin session to the attacker.

If the backend only supports bearer tokens in `localStorage`, record it as an
accepted risk and shorten token lifetime; do not present it as safe.

## Cookie auth requires CSRF defense

When the session rides on cookies, the browser attaches it to cross-site requests too.

- `SameSite=Lax` or `Strict` on the session cookie
- CSRF token header on every state-changing request (`POST/PUT/PATCH/DELETE`)
- Never `SameSite=None` without a deliberate cross-origin requirement

## Refresh flow

Implement in `shared/api/interceptors.ts`, once:

- Single-flight refresh — concurrent 401s wait on one refresh promise, not N refreshes
- On refresh failure: clear client state, clear query cache, redirect to login
- Do not retry indefinitely; cap attempts to avoid a refresh loop against a dead session

```ts
// conceptual
let refreshPromise: Promise<void> | null = null
```

## Logout must clear everything

```text
[ ] Server-side session/refresh token invalidated (call logout endpoint)
[ ] queryClient.clear()   — otherwise next user sees cached data
[ ] Global store reset
[ ] Persisted UI state containing user data removed
```

Clearing only the token leaves the previous user's data in the TanStack Query cache
and in any persisted store — visible on a shared machine.

## Multi-tab and idle

- React to logout in other tabs (`storage` event or a broadcast channel)
- Idle timeout for high-privilege admin sessions, if the product requires it
- Re-authenticate (step-up) before irreversible operations when the backend supports it

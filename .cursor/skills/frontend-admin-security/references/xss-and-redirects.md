# XSS, HTML rendering, and redirects

## React is safe by default — until it isn't

JSX escapes interpolated values. The escape hatches are what cause admin XSS:

```text
dangerouslySetInnerHTML
href / src built from user or API data
<a target="_blank"> without rel="noopener noreferrer"
Injecting into innerHTML via refs
Rendering SVG uploaded by a user
Passing user data into eval-like APIs (new Function, setTimeout with a string)
```

## Rendering rich HTML

Admin apps often render descriptions, email templates, or CMS content.

- Sanitize before rendering (DOMPurify or equivalent), on a strict allow-list.
- Sanitize on **render**, and ideally on the server on write too.
- Do not sanitize "later" or "in the editor only" — the read path is the attack path.
- Keep sanitization in one shared helper so the allow-list is auditable.

```tsx
// only place dangerouslySetInnerHTML should appear
<SafeHtml value={description} />
```

Do not let features call `dangerouslySetInnerHTML` directly.

## URL and link injection

`javascript:` and `data:` URLs execute when clicked.

```tsx
// ✗ user-controlled
;<a href={row.website}>…</a>

// ✓ validate scheme first
const safeHref = isHttpUrl(row.website) ? row.website : undefined
```

Allow only `http:` and `https:` (plus `mailto:`/`tel:` if the product needs them).

## Open redirect after login

```text
/login?returnUrl=https://attacker.example/login
```

A raw redirect sends the user to a convincing fake login page right after they
authenticate.

```ts
// ✓ allow only same-origin, path-only targets
const target =
  returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : ROUTES.DASHBOARD
```

Apply the same rule to any "continue to", "next", or post-action redirect param.

## Content Security Policy

Ask for a CSP header from whoever serves the app. It is the backstop when a
sanitizer misses something. Avoid patterns that force `unsafe-inline`/`unsafe-eval`
(inline event handlers, runtime template compilation).

## Third-party scripts

Every analytics or support widget runs with full access to the admin DOM and to
anything in `localStorage`. Keep the list short, load from a known origin, and
prefer not to load them on high-privilege screens at all.

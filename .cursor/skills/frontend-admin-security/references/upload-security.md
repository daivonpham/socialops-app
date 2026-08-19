# Upload security

Client-side validation in `FileUploader` is **UX**. The server must validate again.

## What the client can check (and its limits)

| Check | Limit |
| --- | --- |
| Extension | Renaming `shell.php` to `photo.png` passes |
| `file.type` (MIME) | Reported by the browser, easy to spoof |
| `file.size` | Real, but the request can be crafted without the UI |

So: check them for fast feedback, and never describe them as protection.

## Server must do

```text
[ ] Verify real content type (magic bytes), not the declared one
[ ] Enforce size limits independently
[ ] Generate its own storage filename — never reuse the client filename
[ ] Store outside the web root / in object storage, not next to served assets
[ ] Serve downloads with Content-Disposition: attachment and a non-executable type
[ ] Virus scan when the product handles untrusted uploads
```

## Frontend rules

- Never build a path from the user-supplied filename; treat it as display text only,
  and escape it when rendering (it can contain markup).
- Prefer pre-signed upload URLs so the file never transits your API with a session cookie.
- Do not render uploaded SVG inline — SVG can carry scripts. Render as `<img src>`
  or convert server-side.
- Do not preview uploaded HTML in the same origin; use a sandboxed iframe or a
  separate origin.
- Show the accepted types and size limit in the UI so failures are predictable.

## Downloads

Links to files must be authorized server-side per request. A guessable or
permanent public URL to a private document is a leak even when the UI hides the link.

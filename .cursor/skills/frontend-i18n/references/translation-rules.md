# Translation and Formatting Rules

## Keys and Namespaces

- Use stable semantic keys (`picker.title`, `actions.retry`), not English source
  sentences as keys.
- Let the namespace express ownership: inside the `brands` namespace prefer
  `picker.title`, not `brands.picker.title`.
- Put a message in `common` only when its meaning is genuinely shared. Identical
  English wording in two domains does not automatically make it the same message.
- Derive key types from the default-locale resource where practical. Do not
  replace type safety with arbitrary `string` casts at call sites.

## Complete Messages

Translate a complete thought so translators can change word order:

```ts
// Correct
t('connectedAccounts', { count, platform })
// Incorrect
`${count} ${t('connected')} ${platform} ${t('accounts')}`
```

Use the library's plural mechanism and pass the variable as `count`. Use a rich
translation component only when a single translated sentence contains React
elements such as a link or emphasized text; ordinary messages use `t()`.

Never embed raw HTML from a translation. If rich content is required, expose a
small allow-listed component mapping and keep interpolation escaped by default.

## What Is Translated

Translate all user-facing language, including:

- headings, body copy, buttons, links, menu and navigation labels
- placeholders, search prompts, empty/error/loading states and retry actions
- tooltips, `aria-label`, accessible names, image alt text when descriptive
- validation messages, confirmations, toasts and document/page titles
- status and permission display labels

Do not translate:

- API, permission, analytics-event and query-key identifiers
- route paths and URL parameter values in this private admin SPA
- enum/status values sent over the wire
- brand, workspace, account and user names
- user-created content or platform trademarks unless product requirements say so

## Shared UI and Adapters

Domain copy is passed into a platform component as props. A truly generic default
such as an empty search message belongs to `shared/ui` and the common namespace.
The Ant adapter receives and renders that value; it must not own hard-coded
English or import feature resources.

Ant Design's locale, text direction, and Day.js locale must change with the
application locale. Update `document.documentElement.lang` and `dir` at the same
boundary. Use logical CSS utilities (`text-start`, `border-s`/`border-e`,
`start-*`/`end-*`) for direction-sensitive layout.

## Dates, Numbers and Timezones

Keep API values locale-neutral: ISO timestamps, numeric amounts, and stable
currency/timezone codes. Format only at the presentation boundary using:

```text
Intl.DateTimeFormat
Intl.NumberFormat
Intl.RelativeTimeFormat
```

Pass the active locale and, for scheduled or cross-region events, an explicit
IANA timezone. Do not scatter fixed date masks, separators, currency symbols, or
manual plural logic through features.

## API and Validation Errors

Do not make backend English `message` strings the localization contract. Prefer
a stable error code plus structured parameters; map the code to a frontend
translation key. Unknown errors use one localized generic fallback and may log
the original diagnostic outside the visible UI.

Validation schemas should produce stable error codes/keys or obtain the active
translator at schema creation time. Do not create a module-level schema whose
messages were translated once and then fail to update after a language change.

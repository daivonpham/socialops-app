# i18n Checklist

## New or Changed UI

```text
[ ] Visible copy uses a semantic key in the owning namespace
[ ] Placeholder, tooltip, aria-label, alt text, toast and validation copy checked
[ ] No translatable sentence is assembled from fragments
[ ] Counts use plural rules with `count`
[ ] Route/config/status/filter metadata stores keys, not `t()` results
[ ] User/domain data and stable identifiers remain untranslated
[ ] Date/number/currency/time output uses active-locale formatting
[ ] Timezone is explicit where scheduling can be ambiguous
[ ] Shared component defaults are not hard-coded inside the Ant adapter
[ ] Direction-sensitive layout uses logical properties when touched
```

## New Feature

```text
[ ] Feature-owned resources live in features/<feature>/i18n
[ ] Namespace is registered or loaded through app composition
[ ] Feature imports no app internals, Ant Design, or feature-external resources
[ ] Feature public API exposes only the resource/loader surface composition needs
[ ] Page remains lazy-loaded; translation loading does not pull unrelated features
```

## New Locale

```text
[ ] BCP 47 locale added to the supported-locale allow-list
[ ] Default and new locale have matching message keys
[ ] Plural, interpolation and representative empty/error states reviewed
[ ] Ant Design locale and Day.js locale mappings exist
[ ] HTML lang and dir update correctly
[ ] Date, time, number, percentage and currency formats smoke-tested
[ ] Long-text layout checked at mobile and desktop widths
[ ] RTL navigation, drawer, popup placement and directional icons checked if relevant
[ ] Missing-key validation passes without relying on fallback in production
```

## Review Gate

Search changed UI files for remaining natural-language literals. Ignore code
identifiers, class names, route paths, test data, comments and user/domain data.
Run the project's type check, lint, translation-key parity check, and relevant UI
tests before completion.

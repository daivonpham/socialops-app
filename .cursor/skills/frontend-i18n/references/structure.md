# i18n Structure

## Target Layout

```text
src/
├── app/
│   ├── i18n/                       # app shell/navigation resources + composition
│   │   ├── en-US.ts
│   │   ├── vi-VN.ts
│   │   └── resources.ts
│   └── providers/
│       └── I18nProvider.tsx        # initialized instance + preference wiring
├── features/
│   └── brands/
│       └── i18n/
│           ├── en-US.ts
│           └── vi-VN.ts
└── shared/
    └── i18n/
        ├── config.ts               # supported locales and i18next options
        ├── locales.ts              # BCP 47 catalog, normalization, direction
        ├── format.ts               # Intl-based formatting helpers
        ├── types.d.ts              # translation resource type augmentation
        └── index.ts
```

Use the smallest version of this layout that the current implementation needs.
Do not create empty resource folders for features with no user-visible copy.

## Ownership

| Concern | Owner |
| --- | --- |
| Locale type, allow-list, normalization, direction, format helpers | `shared/i18n` |
| Shell, navigation, route guard and account-menu messages | `app/i18n` |
| Domain page/component/status/filter messages | `features/<feature>/i18n` |
| i18next instance, preference bootstrap, resource composition | `app/providers/I18nProvider.tsx` + `app/i18n` |
| Ant locale and direction mapping | `app/providers/ThemeProvider.tsx` |
| Generic platform-component defaults | `shared/ui`, backed by the common namespace |
| Kit rendering only | `shared/components/ant` |

Feature resources stay inside their feature. If app-level composition needs a
feature bundle or loader, expose the intended i18n surface from the feature's
root `index.ts`; do not make deep feature imports the normal convention.

## Provider Order and Bootstrap

`I18nProvider` must be above `ThemeProvider`, because Ant locale and direction
depend on the active application locale:

```tsx
<I18nProvider>
  <QueryProvider>
    <ThemeProvider>{/* scope, permissions, router */}</ThemeProvider>
  </QueryProvider>
</I18nProvider>
```

Initialize the default/common messages before the first render so the interface
does not flash in the fallback language. Independent startup work such as MSW
and i18n initialization may run in parallel.

Keep the initial implementation simple: statically registering two small locale
bundles is acceptable. Preserve namespace boundaries so feature namespaces can
be dynamically loaded later when measured bundle size justifies it.

## Route and Configuration Metadata

Route and configuration modules may be initialized once and reused for the
whole session. Store keys, not translated results:

```ts
// Correct: stable at module scope
nav: { labelKey: 'navigation.reports', section: 'main', order: 10 }

// Incorrect: freezes language-dependent output during module initialization
nav: { label: i18n.t('navigation.reports'), section: 'main', order: 10 }
```

Translate `labelKey` in the rendering component with `useTranslation`. Apply the
same rule to statuses, filters, permission labels, select options, and action
metadata.

## Locale Persistence

Use an allow-listed BCP 47 locale. For this product, the normal preference order
is authenticated user profile, a minimal versioned local bootstrap value,
browser preference, then the default locale.

Do not mix locale into Workspace/Brand scope storage. Store only the locale, not
the user object or other profile data. Private admin route paths remain stable;
do not introduce a locale URL segment unless public/SEO requirements explicitly
need one.


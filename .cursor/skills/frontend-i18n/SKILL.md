---
name: frontend-i18n
description: >-
  Internationalization architecture and review rules for the SocialOps React
  admin SPA. Use when adding or changing user-visible copy, locale switching,
  route/navigation labels, validation or API error messages, date/number/timezone
  formatting, Ant Design locale wiring, RTL support, or translation resources.
license: MIT
metadata:
  author: local
  version: "1.0.0"
---

# Frontend i18n

Keeps localization compatible with the repository's `app / features / shared`
architecture. The application locale is a presentation preference; stable
identifiers, API contracts, permission keys, and private admin route paths do
not change with the locale.

## When to Apply

- Adding or editing visible UI copy, including accessibility text
- Creating a feature, route handle, menu item, status, filter, form, or error state
- Implementing language selection or locale persistence
- Formatting dates, timezones, numbers, percentages, currencies, or relative time
- Wiring localized behavior in Ant Design or preparing a component for RTL
- Adding or reviewing a supported locale

## How It Works

1. Decide which layer owns the message; read
   [references/structure.md](references/structure.md) when placing engine,
   provider, or resource files.
2. Read [references/translation-rules.md](references/translation-rules.md) when
   writing UI copy, configuration, formatting, validation, or error handling.
3. Run [references/checklist.md](references/checklist.md) before completing a
   feature with new copy or adding a locale.

## Core Invariants

```text
Engine + common formatters:  shared/i18n
Provider + composition:      app/providers and app/i18n
Feature-owned messages:      features/<feature>/i18n
Locale identifiers:          allow-listed BCP 47 tags (for example en-US, vi-VN)
Translation timing:          during render or an explicit runtime operation
```

- Store semantic keys such as `labelKey` in route/config metadata. Never call
  `t()` at module initialization to create translated constants.
- Use interpolation and plural rules for complete messages. Never construct a
  translatable sentence by concatenating fragments.
- Translate visible text, placeholders, tooltips, accessible names, empty/error
  states, validation, toasts, and document titles.
- Do not translate stable keys, enum values, route paths, query keys, permission
  keys, brand/workspace/user names, or other user-authored data.
- Use `Intl` with the active locale for application formatting. Preserve ISO
  values in API contracts and make timezone explicit where ambiguity matters.
- Keep UI-kit locale mapping behind the app provider/theme boundary. Features
  continue to consume `shared/ui` and never import Ant Design directly.
- Keep the default locale complete. A missing key in another supported locale
  is a validation failure, not an invitation to silently ship mixed-language UI.

## Companion Skills

- `frontend-admin-architecture` — layer and dependency boundaries
- `frontend-shared-platform` — shared UI and adapter ownership
- `frontend-design-system` — layout expansion and logical CSS properties
- `frontend-admin-performance` — namespace and bundle loading decisions
- `frontend-code-simplicity` — avoid speculative localization infrastructure


# Validation

```text
shared/validation/
├── common-rules.ts      # required, email, min/max helpers
├── patterns.ts          # phone, slug, …
├── messages.ts          # default i18n/message templates
└── schema-builders.ts   # compose Zod (or chosen) schemas
```

## Rules

- Kit-agnostic — no dependency on Ant Form rules API.
- Feature schemas live next to the form or in `config/` / `model/`, built from shared builders.
- Prefer one schema library project-wide (recommend Zod).
- Do not invent one-off validators that duplicate `common-rules`.

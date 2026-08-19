---
name: frontend-design-system
description: >-
  Design system layering for admin FE: tokens → primitives → composites → page
  patterns, kept separate from feature architecture. Use when defining colors,
  spacing, typography, shared/ui primitives, composites (DataTable chrome,
  PageHeader), or when features invent one-off visual styles. Triggers on
  "design tokens", "design system", "primitives", "composites", "PageHeader".
license: MIT
metadata:
  author: local
  version: "1.0.0"
---

# Frontend Design System

Visual system for headless admin apps. Architecture lives in
`frontend-admin-architecture`; engines live in `frontend-shared-platform`.
This skill owns **how things look and compose visually**.

## Layers

```text
tokens        → CSS variables / theme object (color, space, type, radius, elevation)
primitives    → Button, Input, Select, Modal, Tag  (shared/ui + adapters)
composites    → PageHeader, FilterBar, ConfirmDialog, StatusTag, EmptyState
patterns      → ListPage layout, FormPage layout, DetailPage layout
```

Read:

- [references/tokens.md](references/tokens.md)
- [references/primitives.md](references/primitives.md)
- [references/composites.md](references/composites.md)
- [references/patterns.md](references/patterns.md)



## Rules

1. Features consume `shared/ui` — never hard-code hex colors for brand UI when tokens exist.
2. New visual widget: ask if it is a primitive, composite, or feature-only one-off.
3. Composites compose primitives; they do not reimplement kit internals.
4. Page patterns are layout recipes, not dump yards for business logic.
5. Kit swap changes adapters + optionally token mapping — not feature JSX.



## Anti-patterns

```text
✗ Feature CSS with random #hex matching brand inconsistently
✗ Copy-paste PageHeader markup into every list page
✗ Putting domain copy/business rules inside shared composites
✗ Growing Ant Form/Table "theme overrides" instead of platform tokens + DataTable shell
```


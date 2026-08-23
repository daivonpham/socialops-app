---
name: frontend-admin-architecture
description: >-
  Headless Frontend Admin architecture: app/features/shared with UI adapters
  (e.g. adapters/ant), TanStack Query, platform-owned shared/ui APIs, RBAC/PBAC,
  and centralized routes. Use when scaffolding admin apps, placing files,
  enforcing import boundaries (no direct antd in features), or deciding
  app vs features vs shared vs adapters. Triggers on "admin architecture",
  "feature folder", "shared/ui", "adapters/ant", "where should this file go".
license: MIT
metadata:
  author: local
  version: '2.0.0'
---

# Frontend Admin Architecture

Root FE platform for large admin apps: many domains, many developers, React +
TypeScript. **UI-library agnostic at the feature layer** — features never import
`antd` (or other UI kits) directly. Headless engines (TanStack Query/Table,
RHF, Zod) own behavior; `shared/adapters/<kit>` supplies visuals.

## Companion skills

- `frontend-shared-platform` — API layer, DataTable, forms, URL filters, drawers, AsyncState, upload, mappers, MSW
- `frontend-design-system` — tokens → primitives → composites → page patterns
- `frontend-admin-security` — auth/session, RBAC boundaries, XSS, data exposure, upload
- `frontend-admin-performance` — Query defaults, virtualization, re-render, bundle
- `frontend-i18n` — localized copy, locale resources/formatting, Ant locale, RTL
- `create-api-module` / `create-admin-feature` — scaffolding
- `frontend-code-simplicity` — reuse-first
- `migrate-admin-template` — template → this architecture

## When to Apply

- Scaffolding or reviewing Frontend Admin structure
- Deciding `app/` vs `features/` vs `shared/` vs `shared/adapters/`
- Blocking direct UI-kit imports from features
- Multi-design / swap UI kit without rewriting features

## How It Works

1. Read [references/structure.md](references/structure.md) — tree + dependency + adapter rules.
2. Read [references/conventions.md](references/conventions.md) — API, routes, permissions, naming.
3. Use [references/checklists.md](references/checklists.md) before create/review.
4. For platform primitives and list-page engines, load `frontend-shared-platform`.
5. For tokens/patterns, load `frontend-design-system`.
6. For anything touching auth, permissions, HTML rendering, or upload, load `frontend-admin-security`.
7. When a list/form/dashboard is slow or the bundle grows, load `frontend-admin-performance`.

## Non-negotiables

```text
Architecture:  app / features / shared (+ shared/adapters/<kit>)
Dependency:    adapters ← shared/ui ← features ← app
Import ban:    features/app must NOT import 'antd' | '@mui/*' | adapters/* directly
UI entry:      features only import @/shared/ui (platform API)
Table engine:  TanStack Table inside shared/ui/DataTable (not Ant Table as engine)
Form engine:   React Hook Form + shared/validation (not Ant Form as engine)
Server state:  TanStack Query; API quartet per feature
Routes:        ONLY app/router
Permissions:   catalog + engine in shared/permissions; feature only combines keys — UX only, server enforces
Status:        one source for value/label/color/options
I18n:          semantic message keys; resources owned by app/feature/shared layer
Public API:    features/<name>/index.ts — no deep imports from outside
```

## Adapter rule (critical)

```text
Phase 1 (bootstrap): adapters/ant may thin-wrap Ant components (import firewall).
Phase 2 (platform):  shared/ui exposes PLATFORM props; adapters map kit → platform.

Features always talk to shared/ui — never to adapters or antd.
```

Passthrough wrappers are allowed **only** under `shared/adapters/<kit>/` (or as
internal impl behind `shared/ui`). They are forbidden as the public API story
for features (“just re-export Ant CardProps forever”).

## Do Not Install Conflicting Community Skills

Do not install wholesale `file-organization`, `feature-arch`, `project-structure-enforcer`
if they ban barrels, split hooks per file, or put routes inside features.

## References

- [references/structure.md](references/structure.md)
- [references/conventions.md](references/conventions.md)
- [references/checklists.md](references/checklists.md)

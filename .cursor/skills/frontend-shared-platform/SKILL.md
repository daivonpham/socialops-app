---
name: frontend-shared-platform
description: >-
  Headless FE platform primitives for admin apps: shared/api, TanStack Query
  defaults, DataTable (TanStack Table), RHF forms, validation, useUrlFilters,
  useEntityDrawer, AsyncState, FileUploader, mappers, and MSW. Use when building
  or reviewing list/filter pages, forms, uploads, drawers, or shared infrastructure.
  Triggers on "DataTable", "useUrlFilters", "AsyncState", "shared/ui", "MSW",
  "FileUploader", "platform primitives".
license: MIT
metadata:
  author: local
  version: "1.0.0"
---

# Frontend Shared Platform

Catalog of **must-reuse** kit-agnostic engines and `shared/ui` entry points.
Aligns with `frontend-admin-architecture` (adapters behind `shared/ui`).

## When to Apply

- Implementing list pages, filters, forms, drawers, uploads
- Adding shared infrastructure under `shared/`
- Reviewing PRs that reinvent Spin/Empty/filter URL parsing/table engines

## How It Works

1. Confirm feature imports only `@/shared/ui`, `@/shared/hooks`, `@/shared/api`, `@/shared/validation`.
2. Pick the primitive below instead of writing a local one.
3. Read the matching reference file for API shape and rules.
4. Never import `antd` or `@/shared/adapters/*` from features.

## Platform catalog

| Concern | Use | Reference |
| --- | --- | --- |
| HTTP + response envelope + list query base | `shared/api` (`CommonApiResponse`, `ListQueryBase`) | [references/api-layer.md](references/api-layer.md) |
| Server state | TanStack Query in feature `api/hooks.ts` | [references/query.md](references/query.md) |
| Authorization | `shared/permissions` (catalog + engine); feature `config/*-access.ts` for policy | `frontend-admin-security/references/authorization.md` |
| Approval/publish lifecycle | Status = rendering, transitions = allowed moves + guards | [references/workflow-transitions.md](references/workflow-transitions.md) |
| Table | `shared/ui/DataTable` (TanStack Table) | [references/data-table.md](references/data-table.md) |
| Form | RHF + `shared/ui` fields | [references/forms.md](references/forms.md) |
| Validation | `shared/validation` | [references/validation.md](references/validation.md) |
| URL filters | `useUrlFilters` | [references/url-filters.md](references/url-filters.md) |
| Drawer/modal entity UI | `useEntityDrawer` | [references/entity-drawer.md](references/entity-drawer.md) |
| Loading/empty/error | `AsyncState` | [references/async-state.md](references/async-state.md) |
| Upload | `FileUploader` / variants | [references/upload.md](references/upload.md) |
| DTO mapping | feature `model/*.mapper.ts` | [references/mappers.md](references/mappers.md) |
| API mock | MSW handlers per feature | [references/msw.md](references/msw.md) |
| UI kit wiring | `shared/adapters/<kit>` behind `shared/ui` | [references/adapters.md](references/adapters.md) |

## Hard bans

```text
✗ import from 'antd' | '@mui/*' in features
✗ import from '@/shared/adapters/*' in features
✗ Ant Design Table / Form as engines in new features
✗ Per-page ad-hoc URL query parsing when useUrlFilters exists
✗ Local Spin/Empty/Error trees when AsyncState exists
✗ Second table/filter/upload stack in parallel
```

## Output

When scaffolding, list which platform primitives were used and confirm no kit imports in feature files.

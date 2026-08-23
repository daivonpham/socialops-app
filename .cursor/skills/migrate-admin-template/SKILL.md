---
name: migrate-admin-template
description: >-
  Migrate an existing admin template into headless Frontend Admin
  app/features/shared (+ adapters) without keeping a permanent dual structure.
  Use when adopting Ant Design Pro, Refine, or similar starters: move layouts
  into app/, kit widgets into shared/adapters then shared/ui, engines into
  platform primitives, business screens into features/. Triggers on "migrate
  template", "restructure admin template", "move to features folder",
  "template to architecture".
license: MIT
metadata:
  author: local
  version: '2.0.0'
---

# Migrate Admin Template

Moves starter/template code into the long-term architecture defined by
`frontend-admin-architecture`. The template is UI/theme/layout source — not the
final business architecture. Target is **headless features** (no direct kit
imports) with adapters behind `shared/ui`.

## When to Apply

- Project started from an admin template
- Need to introduce `app/`, `features/`, `shared/` without breaking the app
- Cleaning demo pages, mocks, and hard-coded routes

## How It Works

### Step 1 — Baseline

Ensure template works as-is:

- install / `dev` / `build` succeed
- router, layout, theme work

### Step 2 — Create target folders

```text
src/app/
src/features/
src/shared/
```

### Step 3 — Move infrastructure

| From template                                     | To                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Layout                                            | `app/layouts/`                                                                                                                   |
| Global providers (incl. `PermissionProvider`)     | `app/providers/`                                                                                                                 |
| Routes                                            | `app/router/` (`paths.ts` + `routes.tsx`)                                                                                        |
| Permission catalog + check engine                 | `shared/permissions/` — **not** `app/`; see `frontend-admin-architecture/references/structure.md#why-permissions-live-in-shared` |
| Global store                                      | `app/store/`                                                                                                                     |
| HTTP client + response envelope + list query base | `shared/api/` (`CommonApiResponse`, `ListQueryBase`)                                                                             |
| Kit widgets (antd, …)                             | `shared/adapters/<kit>/` then re-export via `shared/ui/`                                                                         |
| Generic UI / shells                               | `shared/ui/` (DataTable, AsyncState, …)                                                                                          |
| Generic hooks/helpers/types/config                | `shared/hooks                                                                                                                    | lib | types | config | validation/` |

### Step 4 — Move one business feature at a time

Example:

```text
pages/orders        → features/orders/pages
components/orders   → features/orders/components
services/orders     → features/orders/api  (normalize to quartet)
constants/order     → features/orders/model or config
```

Use `create-admin-feature` / `create-api-module` when reshaping.

### Step 5 — Delete duplicates

After the new feature works:

- remove old pages/APIs/mocks
- remove hard-coded routes in favor of `ROUTES`
- do not keep two implementations

## Hard Rules

- Temporary `template/` or `legacy-template/` only during migration
- Final tree must be `app` + `features` + `shared` (+ `shared/adapters`) only
- Do not let template folder conventions override API quartet, centralized
  routes, adapter firewall, or dependency direction
- Prefer relocating template widgets into adapters/`shared/ui` instead of
  rewriting; then **stop** feature imports of the kit
- After migration, new list/forms use TanStack Table + RHF (not Ant Table/Form
  as engines) — see `frontend-shared-platform`

## References

- [references/mapping.md](references/mapping.md) — full mapping table

## Output

Report migrated paths, remaining legacy folders, and blockers (auth, env, aliases).

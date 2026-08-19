---
name: create-admin-feature
description: >-
  Scaffold a full Frontend Admin business feature under src/features/<name> with
  api quartet, pages, components, config, model, public index, and centralized
  app/router registration. Use when adding a new domain module (orders,
  customers, licenses), CRUD screens, list+filter+table+form flows, or feature
  public API. Triggers on "new feature", "create admin module", "scaffold
  feature", "add orders module".
license: MIT
metadata:
  author: local
  version: "2.0.0"
---

# Create Admin Feature

Scaffolds one business feature that matches `frontend-admin-architecture`.
Uses `create-api-module` for the API layer, `frontend-shared-platform` for
list/form engines, and `frontend-code-simplicity` for implementation style.

## When to Apply

- Adding a new business domain module
- Generating list / create / edit / detail pages for a domain
- Wiring permissions, status metadata, filters, and routes for that domain

## How It Works

1. Confirm domain name (`orders`) and kebab folder (`features/orders`).
2. Create feature skeleton (see layout below).
3. Run / follow `create-api-module` for `api/`.
4. Add status single source; declare the feature's access policy referencing
   the shared permission catalog (never invent new permission keys here).
5. Add list/filter/table/form using platform primitives (`useUrlFilters`,
   `DataTable`, RHF form, `AsyncState`) — see `frontend-shared-platform`.
   Import UI only from `@/shared/ui` (never `antd` / adapters).
6. Register paths in `app/router/paths.ts` and routes in `app/router/routes.tsx`.
7. Export public API from `features/<feature>/index.ts`.
8. Run the checklist in `frontend-admin-architecture` references/checklists.md.

## Target Layout

```text
features/<feature>/
├── api/
│   ├── types.ts
│   ├── service.ts
│   ├── hooks.ts
│   └── index.ts
├── pages/
│   ├── <Entity>ListPage.tsx
│   ├── <Entity>CreatePage.tsx
│   ├── <Entity>EditPage.tsx
│   └── <Entity>DetailPage.tsx
├── components/
│   ├── <Entity>Table/
│   ├── <Entity>Form/
│   ├── <Entity>StatusTag.tsx
│   └── <Action><Entity>Modal.tsx
├── config/
│   ├── <feature>.filters.ts   # UI filter schema (fields the FilterBar renders)
│   └── <feature>-access.ts    # which shared/permissions key(s) each action needs
├── model/
│   ├── <feature>-status.ts
│   ├── <feature>.mapper.ts   # only if needed
│   └── <feature>.types.ts
└── index.ts
```

## Required Steps (detail)

### 1. Access policy

Permission **keys + labels** live once in `shared/permissions/catalog.ts` — never
redeclare them per feature. The feature only declares which key(s) each of its
actions requires, which is often more than one key:

```ts
// config/order-access.ts
import { PERMISSIONS } from '@/shared/permissions'

export const ORDER_ACCESS = {
  VIEW_LIST: [PERMISSIONS.ORDER_VIEW.key],
  CREATE: [PERMISSIONS.ORDER_CREATE.key, PERMISSIONS.ORDER_VIEW.key],
  UPDATE: [PERMISSIONS.ORDER_UPDATE.key, PERMISSIONS.ORDER_VIEW.key],
  DELETE: [PERMISSIONS.ORDER_DELETE.key],
} as const
```

```tsx
<Can allOf={ORDER_ACCESS.CREATE}>
  <Button onClick={openCreateOrder}>Create order</Button>
</Can>
```

If the catalog does not yet have a key this feature needs, add it to
`shared/permissions/catalog.ts` (matching the server's permission name) — do not
define it locally. Catalog + engine: `frontend-admin-security/references/authorization.md`.
These checks control the UI only — confirm the backend authorizes each endpoint.

### 2. Status single source

```ts
// model/order-status.ts — values + meta + options in ONE file
```

Use `StatusTag` from shared UI with that meta. No hard-coded colors/labels in columns.

### 3. Filter schema + URL state

`config/<feature>.filters.ts` declares only the fields the FilterBar renders
(e.g. `status`, `dateRange`) — not `page`/`pageSize`/`keyword`, which come from
the shared `ListQueryBase` used in `api/types.ts`. Wire list state with
`useUrlFilters`; render filter controls via `@/shared/ui` (`FilterBar`, inputs).
Do not invent a new filter/URL stack. See
`frontend-admin-architecture/references/conventions.md#filters-vs-list-query-params`.

### 4. Pages

Pages compose hooks + components. Keep heavy JSX in `components/`.

### 5. Routes (centralized)

Add to `app/router/paths.ts`:

```ts
ORDERS: {
  LIST: '/orders',
  CREATE: '/orders/create',
  DETAIL: (id: string | number) => `/orders/${id}`,
  EDIT: (id: string | number) => `/orders/${id}/edit`,
},
```

Add lazy page entries in `app/router/routes.tsx` with guards as needed. Every page
is `lazy()`-imported — see `frontend-admin-performance/references/bundle.md`.

**Never** create `features/orders/config/order-routes.ts`.

### 6. Public index

Export pages, key components, permissions, status constants, and API public surface.

## Do Not

- Put routes inside the feature
- Split API hooks into multiple files
- Deep-export internal paths as the recommended import style for other features
- Import `antd` / `@/shared/adapters/*` from the feature
- Use Ant Table / Ant Form as engines (use DataTable + RHF)
- Duplicate DataTable / useUrlFilters / AsyncState / FileUploader
- Add speculative mappers/validators/wrappers

## References

- [references/feature-scaffold.md](references/feature-scaffold.md) — ordered file creation + examples

## Output

List created files, router changes, and the public exports added.

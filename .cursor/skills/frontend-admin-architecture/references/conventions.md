# Conventions

## API quartet (mandatory)

```text
features/<feature>/api/
├── types.ts
├── service.ts      # pure HTTP — no UI, no toasts
├── hooks.ts        # ALL TanStack Query hooks + query keys
└── index.ts
```

No `api/hooks/` split. Query keys: one factory in `hooks.ts`.

## API response envelope

If the backend wraps every response the same way, declare that shape **once** in
`shared/api/types.ts` and have feature types extend it — do not redeclare
`success` / `statusCode` / `message` / `metadata` per feature:

```ts
// shared/api/types.ts
export interface CommonApiResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
  metadata?: PaginationMeta
  timestamp: string
  path: string
}
```

```ts
// features/orders/api/service.ts
export const getOrders = (params: GetOrdersParams) =>
  apiClient.get<CommonApiResponse<OrderDto[]>>(ORDER_ENDPOINT, { params })
```

Feature `api/types.ts` only defines the **domain** shapes (`OrderDto`,
`GetOrdersParams`, `CreateOrderPayload`) — never a per-feature response wrapper
like `OrderListResponse`. See `frontend-shared-platform/references/api-layer.md`.

## Routes

Only `app/router/` (`paths.ts`, `routes.tsx`, `guards.tsx`).  
Always `ROUTES.*` — never hard-coded path strings in features.

### Menu derives from routes

Do **not** create a parallel menu list (`app/navigation/menu.ts`, `MENU_ITEMS`
constants, …). Declare nav metadata and the required access on the route
itself, then let both the guard and the sidebar read it:

```tsx
{
  path: ROUTES.REPORTS,
  lazy: () => import('@/pages/reports'),
  handle: {
    nav: { label: 'Reports', order: 30 },
    requires: REPORT_ACCESS.VIEW,   // the same constant <Can> uses
  },
}
```

- Guard: match the active route → `hasPermission(granted, handle.requires)`.
- Sidebar: walk the route tree → keep entries with `handle.nav` that pass the check.

The invariant is the **shared access constant**, not the file count: a route
guard and a menu entry must never restate the permission as a raw string.

Nav sections whose items come from **data** (e.g. connected platforms with
counts, per-tenant modules) are not route metadata — render them with a feature
component inside the layout (`<PlatformNavList />` from
`features/social-accounts`), which owns its own query.

Only split a standalone menu file when the menu genuinely stops mirroring
routes (items that open a modal, external links, one route rendering several
menu entries). Until then, one source.

## Permissions & status

- **Catalog** (key + label, single source for the whole app): `shared/permissions/catalog.ts`
- **Engine** (`hasPermission`, `allOf`/`anyOf`, `<Can>`): `shared/permissions`
- **Feature access policy** — which key(s) an action requires — lives in the
  feature: `features/<f>/config/<f>-access.ts`. An action often needs more than
  one key (e.g. creating an order requires both `order.create` and `order.view`);
  express that as a combo, not a single key:

  ```ts
  // features/orders/config/order-access.ts
  import { PERMISSIONS } from '@/shared/permissions'

  export const ORDER_ACCESS = {
    CREATE: [PERMISSIONS.ORDER_CREATE.key, PERMISSIONS.ORDER_VIEW.key],
    DELETE: [PERMISSIONS.ORDER_DELETE.key],
  } as const
  ```

- Do not name this file `*-permissions.ts` — that name belongs to the catalog,
  which lives in `shared/`, not in the feature.
- Status value/label/color/options: one file in `features/<f>/model/*-status.ts`
- Render with `shared/ui/StatusTag` + meta — no hard-coded colors in columns
- Allowed transitions between statuses (approve/reject/reopen/etc.) are a
  **separate** file, `features/<f>/model/*-transitions.ts` — see
  `frontend-shared-platform/references/workflow-transitions.md`. Do not fold
  transition logic into the status file or into components.

Full model and why the catalog cannot live in `app/permissions`: see
`frontend-admin-architecture/references/structure.md#why-permissions-live-in-shared`
and `frontend-admin-security/references/authorization.md`.

If the app has a nested scope (Workspace → Brand, org → project, …), the
*granted keys* `PermissionProvider` holds are scoped to the active Brand and
come from the backend that way — the catalog/engine above do not change. See
`frontend-admin-security/references/authorization.md#scoped-permissions-per-brand--tenant`.

## Naming

| Kind | Style |
| --- | --- |
| Components | PascalCase, specific (`CancelOrderModal`) |
| Hooks | `use*` |
| Booleans | `is` / `has` / `can` / `should` |
| Constants | UPPER_SNAKE |
| Config files | kebab + namespace (`order-access.ts`, `order.filters.ts`) |

## Forms

- Engine: **React Hook Form** in features/pages
- Schema/messages: **`shared/validation`** (Zod or equivalent) — kit-agnostic
- Inputs: `@/shared/ui/Input` etc. (not `antd` Input in features)
- Do not use Ant Design `Form` / `Form.Item` as the form engine in new code

## Tables

- Engine: **TanStack Table** inside `@/shared/ui/DataTable`
- Features define columns + pass data; do not import Ant `Table`
- Pagination/sort/selection state prefer URL sync via `useUrlFilters` where list pages need shareable URLs

## Filters vs. list query params

Two different things share the word "filter" — keep them separate:

| Concern | Lives in | Contains |
| --- | --- | --- |
| **UI filter schema** (what the FilterBar renders) | `features/<f>/config/<f>.filters.ts` | Field defs, labels, options, defaults — feature-specific |
| **API list query shape** (what the endpoint accepts) | `shared/api/types.ts` (`ListQueryBase`) | `page`, `pageSize`, `keyword`, `fromDate`, `toDate` — same shape on almost every list endpoint |

```ts
// shared/api/types.ts
export type ListQueryBase = {
  page?: number
  pageSize?: number
  keyword?: string
  fromDate?: string
  toDate?: string
}
export type ListQuery<TExtra = object> = ListQueryBase & TExtra
```

```ts
// features/orders/api/types.ts
export type GetOrdersParams = ListQuery<{ status?: OrderStatus }>
```

The feature's `<f>.filters.ts` does not redeclare `page`/`pageSize`/`keyword` —
those come from `ListQueryBase`. It only declares fields the FilterBar actually
renders (e.g. `status`, `dateRange`) and how they map onto the query
(`useUrlFilters` handles URL state; see `frontend-shared-platform/references/url-filters.md`).

- State: `useUrlFilters` from `shared/hooks`
- UI: platform filter composites from `shared/ui` (not ad-hoc query parsers per page)

## Mappers

`features/<f>/model/*.mapper.ts` only when DTO ≠ UI/form shapes.  
No identity mappers. Prefer:

```ts
export const orderMapper = {
  toModel(dto: OrderDto): Order { … },
  toCreatePayload(values: OrderFormValues): CreateOrderPayload { … },
  toFormValues(order: Order): OrderFormValues { … },
}
```

## Errors

1. `shared/api` — auth, refresh, normalize  
2. Feature/page — business toasts, form errors, redirects  

No triple-handling the same error.

## Import enforcement (recommended ESLint)

- `no-restricted-imports`: ban `antd`, `@mui/material`, etc. in `features/**` and prefer ban in `app/**` except providers if needed
- Ban `@/shared/adapters/**` from `features/**`
- Optional: ban deep imports into other features

## Cross-cutting

Reuse-first / simplicity-first / no speculative code / no out-of-scope refactor — see `frontend-code-simplicity`.  
Platform catalog — see `frontend-shared-platform`.

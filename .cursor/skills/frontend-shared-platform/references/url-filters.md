# URL filters (`useUrlFilters`)

## Problems this solves

- Refresh loses filters
- Back/forward loses state
- URLs not shareable
- Pagination out of sync
- Each page parses query strings differently

## Two shapes, one hook

`useUrlFilters` manages URL state for the **combined** shape — common list params
(`page`, `pageSize`, `keyword`, …) plus whatever the feature's own filter fields
are. Keep the two declarations separate even though they merge at the call site:

```ts
// shared/api/types.ts — same on almost every list
export type ListQueryBase = { page?: number; pageSize?: number; keyword?: string; fromDate?: string; toDate?: string }

// features/orders/config/order.filters.ts — only this feature's fields
export type OrderFilterFields = { status?: OrderStatus }
```

```ts
// features/orders/pages/OrderListPage.tsx
import type { ListQueryBase } from '@/shared/api/types'
import type { OrderFilterFields } from '../config/order.filters'

type OrderFilters = ListQueryBase & OrderFilterFields

const { filters, setFilter, setFilters, resetFilters } = useUrlFilters<OrderFilters>({
  page: 1,
  pageSize: 20,
  keyword: '',
  status: undefined,
})
```

URL example: `/orders?page=2&pageSize=20&status=paid&keyword=CTJ`

`filters` is exactly what `api/hooks.ts`'s `GetOrdersParams` (a `ListQuery<OrderFilterFields>`)
expects — no separate mapping step between URL state and the query.

## Rules

- Default for list pages with filters/pagination.
- Serialize/deserialize in one hook — features pass defaults + types only.
- `config/<feature>.filters.ts` declares only the feature-specific fields (and,
  if the FilterBar is schema-driven, the field/label/options config) — it does
  not redeclare `page`/`pageSize`/`keyword`, which come from `ListQueryBase`.
- Do not hand-roll `URLSearchParams` in each page when this exists.

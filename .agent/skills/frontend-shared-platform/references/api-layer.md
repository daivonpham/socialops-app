# API layer

```text
shared/api/
├── client.ts           # or api-client.ts — axios/fetch instance
├── api-error.ts        # normalized error type + parsers
├── interceptors.ts     # auth header, refresh, error mapping
├── request-config.ts   # timeouts, baseURL from env
└── types.ts            # CommonApiResponse, PaginationMeta, ListQueryBase, ListQuery
```

## Shared response envelope

If the backend wraps every response the same way, declare it **once** here —
feature `api/types.ts` extends it instead of redeclaring `success` /
`statusCode` / `metadata` per feature:

```ts
// shared/api/types.ts
export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
}

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

## Shared list query shape

Almost every list endpoint accepts the same base params. Declare them once and
let features extend with `Pick`/intersection instead of retyping them:

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

// a feature that only needs a subset can Pick instead of intersecting
export type ExportOrdersParams = Pick<ListQueryBase, 'fromDate' | 'toDate'>
```

If the backend uses different names for the same concepts (`limit` instead of
`pageSize`, `search` instead of `keyword`), map them in the feature's
`service.ts`, not by inventing a second base type — `ListQueryBase` stays the
one contract features are written against.

## Rules

- Base URL from env only — never hard-code domain.
- Feature endpoints live in `features/*/api/service.ts`, not in `shared/api`.
- Interceptors handle 401/refresh/normalize; features handle business UX.
- Export a single `apiClient` used by all feature services.
- Token storage, single-flight refresh, CSRF, and logout cleanup:
  `frontend-admin-security/references/auth-session.md`.

## Feature service

```ts
import { apiClient } from '@/shared/api/client'
```

No toasts, navigate, or React in services.

---
name: create-api-module
description: >-
  Scaffold a Frontend Admin feature API module as the mandatory quartet
  types.ts, service.ts, hooks.ts, and index.ts with TanStack Query keys and
  pure HTTP services. Use when adding or regenerating feature API layers,
  query hooks, mutations, or query keys. Triggers on "create api module",
  "api/hooks.ts", "ORDER_QUERY_KEYS", "TanStack Query feature API".
license: MIT
metadata:
  author: local
  version: "1.0.0"
---

# Create API Module

Creates or regenerates `features/<feature>/api/` using the Frontend Admin
architecture. Always align with `frontend-admin-architecture`.

## When to Apply

- Adding API access for a feature
- Fixing a split `api/hooks/*.ts` layout back to one `hooks.ts`
- Introducing query keys / CRUD hooks for a domain

## How It Works

1. Confirm feature name (`orders`, `customers`, ...).
2. Ensure folder `src/features/<feature>/api/` exists.
3. Create or update the **quartet only** (no extra folders):
   - `types.ts` — API contracts
   - `service.ts` — pure HTTP via `@/shared/api/client`
   - `hooks.ts` — query keys + all `useQuery` / `useMutation`
   - `index.ts` — public exports
4. Wire exports from `features/<feature>/index.ts` if needed.
5. Do **not** put UI feedback, navigate, or permission checks in `service.ts`.

## Required File Layout

```text
features/<feature>/api/
├── types.ts
├── service.ts
├── hooks.ts
└── index.ts
```

Forbidden layouts:

```text
api/hooks/useGetX.ts
api/queries/
api/mutations/
api/services/
```

## Templates

### types.ts

Extend the shared list query and response envelope — do not redeclare
`page`/`pageSize`/`keyword` or invent a per-feature response wrapper:

```ts
import type { ListQuery } from '@/shared/api/types'

export type GetOrdersParams = ListQuery<{ status?: OrderStatus }>

export type CreateOrderPayload = {
  customerId: number
  items: OrderItemPayload[]
}

export type UpdateOrderPayload = Partial<CreateOrderPayload>
```

`OrderDto` is wrapped in `CommonApiResponse<T>` (from `@/shared/api/types`) at
the call site in `service.ts` — no `OrderListResponse` / `OrderDetailResponse`
type needed. If the backend's list params use different names (`limit` instead
of `pageSize`), map them in `service.ts`, not by changing `GetOrdersParams`.

### service.ts

```ts
import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  CreateOrderPayload,
  GetOrdersParams,
  OrderDto,
  UpdateOrderPayload,
} from './types'

const ORDER_ENDPOINT = '/orders'

export const getOrders = (params: GetOrdersParams) =>
  apiClient.get<CommonApiResponse<OrderDto[]>>(ORDER_ENDPOINT, { params })

export const getOrderById = (id: number) =>
  apiClient.get<CommonApiResponse<OrderDto>>(`${ORDER_ENDPOINT}/${id}`)

export const createOrder = (payload: CreateOrderPayload) =>
  apiClient.post<CommonApiResponse<OrderDto>>(ORDER_ENDPOINT, payload)

export const updateOrder = (id: number, payload: UpdateOrderPayload) =>
  apiClient.patch<CommonApiResponse<OrderDto>>(`${ORDER_ENDPOINT}/${id}`, payload)

export const deleteOrder = (id: number) =>
  apiClient.delete(`${ORDER_ENDPOINT}/${id}`)
```

### hooks.ts

```ts
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  updateOrder,
} from './service'
import type { GetOrdersParams, UpdateOrderPayload } from './types'

export const ORDER_QUERY_KEYS = {
  all: ['orders'] as const,
  lists: () => [...ORDER_QUERY_KEYS.all, 'list'] as const,
  list: (params: GetOrdersParams) =>
    [...ORDER_QUERY_KEYS.lists(), params] as const,
  details: () => [...ORDER_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...ORDER_QUERY_KEYS.details(), id] as const,
}

export const useGetOrders = (params: GetOrdersParams) =>
  useQuery({
    queryKey: ORDER_QUERY_KEYS.list(params),
    queryFn: () => getOrders(params),
    // response is CommonApiResponse<OrderDto[]>; components read .data / .metadata
    placeholderData: keepPreviousData,
  })

export const useGetOrderById = (id: number) =>
  useQuery({
    queryKey: ORDER_QUERY_KEYS.detail(id),
    queryFn: () => getOrderById(id),
    enabled: Number.isFinite(id),
    select: (res) => res.data, // detail screens usually want the entity directly
  })

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.lists() })
    },
  })
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateOrderPayload }) =>
      updateOrder(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.detail(id) })
    },
  })
}

export const useDeleteOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.lists() })
    },
  })
}
```

### index.ts

Prefer explicit exports on large features; `export *` is acceptable on small ones.

## Rules

- Keep **all** feature TanStack hooks in this single `hooks.ts`
- Invalidation belongs in mutation `onSuccess` / dedicated helpers here — not in `service.ts`
- Business toasts/modals belong in pages/components, not the service layer
- `types.ts` extends `@/shared/api/types` (`ListQuery`, `CommonApiResponse`) —
  never redeclares the envelope or the common list params per feature
- See [references/api-rules.md](references/api-rules.md) for do/don't detail

## Output

Report created/updated paths and any exports added to the feature root `index.ts`.

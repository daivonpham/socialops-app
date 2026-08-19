# DataTable (TanStack Table)

## Placement

```text
shared/ui/DataTable/     # engine + shell (a11y, sticky header slots, empty slot)
features/.../columns.ts  # column definitions
```

## Why not Ant Table as engine

Ant Table owns behavior + visuals. Swapping design or matching multi-kit requires fighting Ant APIs.  
TanStack Table owns **state/logic**; `shared/ui` + adapters own **pixels**.

## Feature usage (conceptual)

```tsx
import { DataTable } from '@/shared/ui/DataTable'
import { useUrlFilters } from '@/shared/hooks/useUrlFilters'

const { filters, setFilters } = useUrlFilters<OrderFilters>({ page: 1, pageSize: 20 })
const { data, isLoading, error } = useGetOrders(filters)

<AsyncState loading={isLoading} error={error} empty={!data?.data.length}>
  <DataTable
    columns={orderColumns}
    data={data?.data ?? []}
    pagination={{ /* synced with filters.page */ }}
  />
</AsyncState>
```

## Rules

- Features define columns; do not fork a second table library.
- Selection/sort/pagination models live in TanStack state and/or URL filters.
- Cell UI uses `@/shared/ui` primitives (Button, StatusTag), never `antd` directly.
- Virtualization/sticky/advanced UX belong in `DataTable` shell once, not per feature.

Virtualization thresholds, stable column identity, selection cost, and export
strategy: `frontend-admin-performance/references/tables.md`.

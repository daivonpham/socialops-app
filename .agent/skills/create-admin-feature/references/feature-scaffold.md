# Feature scaffold order

Create files in this order to keep boundaries clean:

1. `features/<feature>/` folder
2. `api/` quartet (`create-api-module`) — list params extend shared `ListQueryBase`
3. `model/<feature>-status.ts` (+ types/mapper only if needed)
4. `config/<feature>-access.ts` (references `shared/permissions` catalog) +
   `config/<feature>.filters.ts` (UI filter fields only)
5. Components: StatusTag → Table → Form → action modals
6. Pages: List → Create → Edit → Detail
7. `index.ts` public exports
8. `app/router/paths.ts` + `routes.tsx`

## List page composition pattern

```tsx
// pages/OrderListPage.tsx — conceptual
export default function OrderListPage() {
  // 1. useUrlFilters + list query (api/hooks)
  // 2. FilterBar / SearchInput from @/shared/ui
  // 3. AsyncState → OrderTable (DataTable + columns)
  // 4. <Can allOf={ORDER_ACCESS.CREATE}> → navigate(ROUTES.ORDERS.CREATE)
  // Never: import from 'antd' or adapters
}
```

## When NOT to create a new feature

- Only splitting because a file is long
- Two small mutations that still belong to the same domain
- A single presentational component with no API/pages

Prefer growing `orders/api/hooks.ts` until refunds/transfers become independent domains with their own lifecycle, permissions, and pages.

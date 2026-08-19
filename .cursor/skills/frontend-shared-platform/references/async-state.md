# AsyncState

## Problem

Every page repeats loading/error/empty branches.

## API (conceptual)

```tsx
<AsyncState
  loading={isLoading}
  error={error}
  empty={!orders.length}
  emptyTitle="Chưa có đơn hàng"
>
  <OrderTable />
</AsyncState>
```

## Rules

- Default for list/detail async views.
- Do not invent parallel full-page Spin/Empty stacks in features.
- Allow slot overrides (`loadingFallback`, `errorFallback`) when UX differs.
- Empty vs error must stay distinct.

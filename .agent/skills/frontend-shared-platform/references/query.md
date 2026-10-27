# TanStack Query conventions

- All feature hooks in `features/<f>/api/hooks.ts`.
- One `*_QUERY_KEYS` factory per feature.
- Prefer `invalidateQueries` on mutation success for lists/details.
- Use `enabled` for dependent queries — do not invent parallel loading flags.
- Set app-wide defaults in `app/providers/QueryProvider` (`staleTime`, `retry` policy).
- Server state stays in Query — not global redux/zustand — unless truly client-only.

Do not put `useGetOrders` in `shared/hooks`.

For `staleTime` / `refetchOnWindowFocus` defaults, `keepPreviousData` pagination,
search debounce, and prefetch-on-hover, see `frontend-admin-performance`
(`references/data-fetching.md`).

## Scoped query keys (multi-tenant / Workspace → Brand apps)

If a response varies by Workspace, Brand, or any other active scope, that scope
id is part of the identity of the data — put it in the key:

```ts
export const ORDER_QUERY_KEYS = {
  list: (brandId: string, params: GetOrdersParams) => ['orders', brandId, params] as const,
  detail: (brandId: string, id: string) => ['orders', brandId, id] as const,
}
```

Read the active scope id from **one shared source**: `shared/scope` holds the
context + `useActiveBrand()` / `useActiveWorkspace()` accessors, and
`app/providers/ScopeProvider` supplies the value and persistence — the same
split as `shared/permissions` (engine in `shared`, data injected by `app`), so
`features` can read the scope without importing `app`. Never let each feature
read "current brand" its own way from `localStorage` or the URL. This is
enough — no manual `invalidateQueries` on scope
switch is needed: a different key is already a different cache entry, so
switching Brand naturally fetches (or reuses cached) data for the new scope
without leaking the previous one.

```text
✗ Query key without the active scope id when the response differs per Brand/Workspace
✗ Each feature reading "current brand" its own way (context, prop drilling, URL)
```

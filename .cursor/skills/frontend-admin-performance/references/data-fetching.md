# Data fetching performance

Expands `frontend-shared-platform/references/query.md`.

## Global defaults (`app/providers/QueryProvider`)

```ts
defaultOptions: {
  queries: {
    staleTime: 30_000,          // admin data is rarely per-second fresh
    gcTime: 5 * 60_000,
    retry: 1,                   // don't retry a 4xx three times
    refetchOnWindowFocus: false // admins tab away constantly
  },
}
```

`refetchOnWindowFocus: true` with `staleTime: 0` is the single most common cause of
an admin app hammering the API: every alt-tab refetches every mounted query.

Retry policy should skip 4xx entirely — retrying a 403 three times just delays the
error message.

## Pagination without flicker

```ts
useQuery({
  queryKey: ORDER_QUERY_KEYS.list(filters),
  queryFn: () => getOrders(filters),
  placeholderData: keepPreviousData,
})
```

Without this, changing page unmounts the table, shows a spinner, and resets scroll.
With it, the previous page stays visible while the next loads. Use `isFetching` to
show a subtle indicator instead of a full skeleton.

This belongs in the shared list-query helper so no feature forgets it.

## Search and filter input

Debounce the value that enters the query key, not the input itself:

```ts
const [keyword, setKeyword] = useState('') // instant, controlled input
const debounced = useDebouncedValue(keyword, 300) // enters filters → query key
```

Debouncing the input makes typing feel broken. Debouncing the query key is what
you actually want. 300ms is a reasonable default for admin search.

Also set `enabled` so an empty or too-short keyword does not fire a query.

## Avoid unstable query keys

```ts
// ✗ new object identity every render, but same content — still fine for TanStack
//   (keys are compared structurally) — the real problem is unstable CONTENT:
list: (filters) => [...KEYS.lists(), filters]
```

Make sure `filters` does not contain `Date` objects, functions, or values that
change every render (like `Date.now()`), or the key changes constantly and every
render refetches.

## Dependent and conditional queries

```ts
useQuery({ queryKey: KEYS.detail(id), queryFn: …, enabled: id != null })
```

Use `enabled` rather than rendering the hook conditionally or adding your own
loading flags.

## Prefetch on intent

For row → detail navigation, prefetch on hover or focus:

```ts
const prefetch = () =>
  queryClient.prefetchQuery({
    queryKey: KEYS.detail(row.id),
    queryFn: () => getOrderById(row.id),
  })
```

Cheap, and makes the detail drawer feel instant. Do not prefetch every row on
mount — that is the refetch storm again.

## Invalidation scope

```ts
// ✓ narrow
invalidateQueries({ queryKey: ORDER_QUERY_KEYS.lists() })

// ✗ nukes everything, refetches every mounted query in the app
queryClient.invalidateQueries()
```

## Dashboards

- Independent widgets = independent queries, so one slow widget does not block others.
- Give slow aggregate endpoints a longer `staleTime`; they are rarely real-time.
- Poll (`refetchInterval`) only where the product needs it, and pause when the tab
  is hidden.

## Big responses

If a list endpoint returns thousands of rows so the client can filter, that is a
backend fix, not a frontend one. Client-side filtering of large datasets also has
security implications — see `frontend-admin-security`.

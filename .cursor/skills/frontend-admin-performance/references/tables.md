# Table performance

Admin tables are the usual bottleneck: many rows × many columns × rich cells.

## Virtualization threshold

```text
< 100 visible rows   → plain rendering is fine
100 – 500 rows       → virtualize if cells are rich (badges, menus, avatars)
> 500 rows           → always virtualize
```

Virtualization lives in `shared/ui/DataTable` once (TanStack Virtual), never
per feature. A feature should get it by passing data, not by wiring a virtualizer.

Prefer server-side pagination over rendering 5,000 rows at all. Virtualization
fixes rendering cost, not transfer and memory cost.

## Column definitions must be stable

```tsx
// ✗ new array identity every render → TanStack rebuilds the table model
const columns = [ … ]

// ✓ module constant, or useMemo with real dependencies
const ORDER_COLUMNS: ColumnDef<Order>[] = [ … ]
```

If a column needs a handler, pass it through `meta` or a context rather than
rebuilding the whole column array on every render.

## Cell rendering

- Keep cells cheap. A cell renders once per row per render.
- Do not create functions, regexes, or formatters inside a cell renderer — hoist
  `Intl.NumberFormat` / `Intl.DateTimeFormat` instances to module scope.
- Avoid a heavy dropdown component per row; render the menu on open, not on mount.
- Do not call hooks that subscribe to global state in every cell.

## Row selection

Store selection as a `Set` or record keyed by id, not an array you `.includes()`
per row. With 1,000 rows and an array, every render is O(n²).

## Sorting and filtering

Server-side for anything paginated — sorting only the current page client-side is
a bug, not an optimization. Client-side sorting is acceptable only when the full
dataset is already loaded and small.

Use `toSorted()` rather than `sort()` so you do not mutate query cache data.

## Sticky headers and wide tables

Horizontal scroll with many sticky columns causes repaint jank. Limit sticky
columns to the identifier column plus actions, and keep sticky styling in the
`DataTable` shell so it is tuned once.

## Expanding rows and nested tables

Render expanded content lazily on expand. A nested table mounted for every row —
even collapsed — multiplies the cost invisibly.

## Export

Exporting thousands of rows to CSV/Excel on the main thread freezes the tab.
Prefer a backend export endpoint. If it must be client-side, chunk the work or
move it to a web worker, and show real progress.

# Entity drawer/modal (`useEntityDrawer`)

## Problem

Repeated local state:

```ts
const [open, setOpen] = useState(false)
const [selectedItem, setSelectedItem] = useState(null)
const [mode, setMode] = useState('create')
```

## API (conceptual)

```ts
const drawer = useEntityDrawer<Order>()

drawer.openCreate()
drawer.openEdit(order)
drawer.openDetail(order)
drawer.close()
```

```ts
type EntityDrawerState<T> =
  | { open: false }
  | { open: true; mode: 'create'; data?: never }
  | { open: true; mode: 'edit'; data: T }
  | { open: true; mode: 'detail'; data: T }
```

## Rules

- Hook is kit-agnostic; render `Modal` or `Drawer` imported from `@/shared/ui`.
- Keep state local to the page/feature that owns the flow — not global store by default.
- Name UI `CancelOrderModal` etc.; hook only manages open/mode/data.

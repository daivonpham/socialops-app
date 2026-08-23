# Structure & Dependency

## Goals

1. Domain-split features with clear boundaries.
2. Easy to find/change files; limited cross-imports.
3. No hard-coded paths, permissions, status labels/colors.
4. Reuse platform `shared/ui` — never duplicate table/form/filter engines.
5. **Features independent of UI kit** (Ant, MUI, …) via adapters.
6. Headless behavior (Query, Table, Form, URL state) owned by platform.
7. Templates must not dictate long-term architecture.
8. Automatable rules (ESLint) for import bans.

## Tree

```text
src/
├── app/
│   ├── layouts/
│   ├── providers/        # incl. PermissionProvider (injects user's granted keys)
│   ├── router/
│   └── store/
│
├── features/
│   └── orders/
│       ├── api/          # types.ts service.ts hooks.ts index.ts
│       ├── pages/
│       ├── components/   # domain UI only
│       ├── config/       # <feature>-access.ts, <feature>.filters.ts
│       ├── model/
│       └── index.ts
│
└── shared/
    ├── api/              # client, errors, interceptors, ListQueryBase, CommonApiResponse
    ├── permissions/       # catalog.ts, hasPermission.ts, Can.tsx — single source + engine
    ├── validation/       # zod/rules builders (kit-agnostic)
    ├── hooks/            # useUrlFilters, useEntityDrawer, …
    ├── lib/
    ├── types/
    ├── config/
    ├── ui/               # PLATFORM public components (only entry for features)
    │   ├── Button/
    │   ├── Input/
    │   ├── Select/
    │   ├── Card/
    │   ├── Modal/
    │   ├── DataTable/    # TanStack Table engine + slots
    │   ├── AsyncState/
    │   ├── FileUploader/
    │   └── StatusTag/
    └── adapters/
        └── ant/          # Ant implementations (or thin wraps) — INTERNAL
            ├── Button.tsx
            ├── Input.tsx
            ├── Card.tsx
            └── index.ts
```

Optional later: `shared/adapters/custom/` for a second design skin.

## Layers

| Layer                    | Owns                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                   | Layouts, providers (incl. injecting the current user's permissions), router, global store                                        |
| `features/`              | Business domains — **must not** import UI kits or adapters                                                                       |
| `shared/ui/`             | Platform component **public API** (stable props for features)                                                                    |
| `shared/permissions/`    | Permission **catalog** (key + label) + `hasPermission`/`Can` **engine** — single source, importable by both `app` and `features` |
| `shared/adapters/<kit>/` | Map kit widgets → used only by `shared/ui`                                                                                       |
| `shared/api              | hooks                                                                                                                            | validation | …`  | Kit-agnostic infrastructure |

## Dependency direction

```text
shared/adapters → shared/ui → features → app
```

More precisely:

- `shared/adapters/*` may import UI kits (`antd`, …)
- `shared/ui` may import `shared/adapters/<active-kit>` (or inject via provider)
- `features` and `app` layouts/pages may import `@/shared/ui`, `@/shared/hooks`, `@/shared/api`, …
- `features` / `app` must **not** import `antd`, `@/shared/adapters/*`
- `shared` (except adapters) must **not** import `features` or `app`
- Feature A must not deep-import Feature B internals

### Valid

```ts
import { DataTable } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { apiClient } from '@/shared/api/client'
import { useUrlFilters } from '@/shared/hooks/useUrlFilters'
import { PERMISSIONS, Can, hasPermission } from '@/shared/permissions'
```

`shared/permissions` is the one exception allowed to be imported by **both**
`features` and `app` — it is infrastructure (catalog + engine), not a feature or
an app-only concern. See [Why permissions live in shared](#why-permissions-live-in-shared).

### Invalid

```ts
import { Table, Button } from 'antd'
import { Button } from '@/shared/adapters/ant/Button'
import { appStore } from '@/app/store' // from a feature
```

## Why adapters exist

| Approach                                                  | Result                                         |
| --------------------------------------------------------- | ---------------------------------------------- |
| Features import `antd`                                    | Locked to Ant; multi-design fails              |
| Features import thin Ant re-exports as public API forever | Import firewall only; still Ant-shaped props   |
| Features import `shared/ui`; adapters behind UI           | **Swap/skin by changing adapters + ui wiring** |

Bootstrap may use thin Ant wraps **inside adapters**. Target is platform-owned props on `shared/ui`.

## DataTable placement

```text
shared/ui/DataTable     ← TanStack Table (logic) + layout/a11y/slots
shared/adapters/ant/*   ← Checkbox, Input, Pagination visuals used by slots
features/*/components   ← column defs, cell renderers using shared/ui
```

Do **not** make `adapters/ant/Table` (Ant Table engine) the source of truth.

## `app/`

- `layouts/` — chrome only
- `providers/` — QueryClient, theme/adapter provider, auth, error boundary,
  `PermissionProvider` (fetches/holds the current user's granted keys and feeds
  `shared/permissions`)
- `router/` — sole `paths.ts` + `routes.tsx` + guards (guards call `hasPermission`
  from `shared/permissions`)
- `store/` — true global client state only (not server state)

## Why permissions live in shared

Permission **keys must be importable by features** (to build `Can`/`allOf` checks)
and the **engine must be importable by app** (to guard routes). Putting the
catalog + engine in `app/permissions` would force `features → app`, which breaks
the dependency direction above. Putting them in `shared/permissions` keeps both
directions valid:

```text
shared/permissions/
├── catalog.ts       # PERMISSIONS = { ORDER_CREATE: { key, label }, … } — single source
├── types.ts
├── hasPermission.ts # hasPermission(granted, key), allOf(...), anyOf(...)
├── Can.tsx
└── index.ts
```

`app/providers/PermissionProvider` supplies the _data_ (which keys the current
user has); `shared/permissions` supplies the _logic_ (how to check them). Feature
policy — which keys combine for a given action — lives in the feature's own
`config/<feature>-access.ts` (see `frontend-admin-security` for the full model).

## `features/<feature>/`

```text
api/  pages/  components/  config/  model/  index.ts
```

Public API via root `index.ts`. Outside code imports `@/features/orders`, not deep paths.

## Nesting & cycles

- Prefer shallow folders (`components/OrderTable/…`)
- No circular feature imports; share contracts in `shared/types` or compose in `app`

## Template mapping

| Template                                  | Target                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| Layout / providers / router / store       | `app/`                                                                  |
| HTTP client / hooks / validation / config | `shared/`                                                               |
| Permission constants + role/menu logic    | `shared/permissions/` (catalog + engine), `app/providers` (data source) |
| Ant (or kit) raw usage                    | `shared/adapters/<kit>/` then expose via `shared/ui`                    |
| Business pages/components/services        | `features/<feature>/`                                                   |
| Demo / unused mocks                       | Delete                                                                  |

Do not keep a permanent dual `template/` + `app/features/shared` architecture.

# Authorization (RBAC / PBAC)

## What the frontend can and cannot do

| Layer | Purpose | Security value |
| --- | --- | --- |
| Menu filtering | Reduce noise | None |
| Route guard | Avoid dead-end screens | None |
| `Can()` around a button | Prevent confusing failures | None |
| Backend authorization on each endpoint | Actual enforcement | All of it |

Everything the frontend does is a **usability** feature. An attacker skips the UI
and calls the endpoint. Write it down this way in PRs so nobody assumes otherwise.

## Practical consequences

- A new endpoint needs backend authorization **before** the UI ships, not after.
- Never rely on "the page is only reachable from the admin menu".
- Do not send a `role` or `permissions` field from the client and let the server trust it.
- Do not compute "is this allowed" from data the client could edit (e.g. a hidden form field).

## Where things live

```text
shared/permissions/
├── catalog.ts       # PERMISSIONS = { ORDER_CREATE: { key: 'order.create', label }, … }
├── hasPermission.ts # hasPermission(granted, key); allOf(granted, keys); anyOf(granted, keys)
├── Can.tsx           # <Can allOf={[...]}> / <Can anyOf={[...]}>
└── index.ts

app/providers/PermissionProvider.tsx   # loads the granted keys for the active scope, provides them
app/router/routes.tsx                  # guards call hasPermission/allOf from shared/permissions

features/<f>/config/<f>-access.ts      # POLICY: which catalog key(s) an action needs
```

The catalog is a **single source for the whole app** — one place that also feeds
a role/permission-matrix screen (key + human label). It cannot live under
`app/permissions`, because features need to import keys to build their access
policy, and `features → app` is not an allowed import direction. `shared/` is
importable by both `features` and `app`, so the catalog and the check functions
(the reusable *engine*) belong there. `app/` only supplies the *data* — which
keys the logged-in user actually has — via a provider.

Keys are string constants shared with the backend contract. Keep them identical to
the server's permission names so drift is visible.

## Actions often need more than one key

A single button frequently guards on a **combination** of permissions, not one:

```ts
// features/orders/config/order-access.ts
import { PERMISSIONS } from '@/shared/permissions'

export const ORDER_ACCESS = {
  // creating an order also requires being able to view the list it lands in
  CREATE: [PERMISSIONS.ORDER_CREATE.key, PERMISSIONS.ORDER_VIEW.key],
  UPDATE: [PERMISSIONS.ORDER_UPDATE.key, PERMISSIONS.ORDER_VIEW.key],
  DELETE: [PERMISSIONS.ORDER_DELETE.key],
} as const
```

```tsx
<Can allOf={ORDER_ACCESS.CREATE}>
  <Button onClick={openCreateOrder}>Create order</Button>
</Can>
```

This file is **policy**, not the catalog — it never defines a new key, only
references existing ones from `shared/permissions`. Do not name it
`<feature>-permissions.ts`; that name is reserved for the catalog itself, which
does not live in the feature.

`allOf` / `anyOf` are the two combinators the engine needs to support. Most admin
actions only need `allOf`; reserve `anyOf` for "any one of these roles/keys can
do this" cases.

## Guards

- Guard both the route and the action. Route-only guards leave deep links to
  child actions unguarded in the UI.
- Unauthorized should render a clear 403 view, not a blank screen or infinite spinner.
- Do not redirect an authorized-but-still-loading user to 403 — wait for the
  permission source to resolve.

## Scoped permissions (per Brand / tenant)

In apps with a nested scope (Workspace → Brand, org → project, …), the same
user can hold **different** permissions in different Brands. The engine does
not change — `hasPermission`/`allOf`/`anyOf` still take one flat array of
granted keys. Only the **source** of that array changes:

- The backend returns granted keys scoped to a Brand (e.g. as part of the Brand
  detail/switch response), not one global list for the whole user.
- `PermissionProvider` holds the granted keys for the **active** Brand only,
  and re-reads them when the active Brand changes — it does not merge every
  Brand's permissions into one blob up front.
- A component checking `Can`/`hasPermission` is always asking "can the current
  user do X **in the currently active Brand**" — never "…anywhere".

```text
✗ Fetching all Brands' permissions once and keeping them all in memory forever
✗ Reusing the previous Brand's granted keys while the new Brand's are loading
  (render a loading state instead — see "Guards" above)
```

This still obeys the same rule as everything else in this file: the backend
must actually enforce per-Brand access on each endpoint. The frontend scoping
above only prevents showing actions the user cannot take in this Brand — it is
not what stops them from taking it.

## Data-level (PBAC) checks

Row-level rules ("can edit only own tenant's orders") must be evaluated by the
backend and reflected by the API response. If the frontend has to guess, the list
endpoint is returning data the user should not see in the first place.

## Common mistakes in admin apps

```text
✗ Hiding a column but still fetching the sensitive field into the client
✗ Loading all tenants and filtering client-side
✗ Enabling a bulk action because one selected row is permitted
✗ Caching permission results with no invalidation after a role change
✗ Using the same query key for data that differs per role
```

The first two are data leaks even though the screen looks correct: the values are
in the network response and in the query cache.

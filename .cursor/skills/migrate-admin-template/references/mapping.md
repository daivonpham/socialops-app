# Template → architecture mapping

| Template origin                                   | New location                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| Layout                                            | `app/layouts/`                                                              |
| Global provider (incl. `PermissionProvider`)      | `app/providers/`                                                            |
| Router                                            | `app/router/`                                                               |
| Permission catalog + check engine                 | `shared/permissions/` (feature policy: `features/<f>/config/<f>-access.ts`) |
| Global store                                      | `app/store/`                                                                |
| Generic UI / shells                               | `shared/ui/` (DataTable, AsyncState, …)                                     |
| Kit widgets (antd, …)                             | `shared/adapters/<kit>/` → consumed only by `shared/ui`                     |
| HTTP client + response envelope + list query base | `shared/api/` (`CommonApiResponse`, `ListQueryBase`)                        |
| Generic hooks                                     | `shared/hooks/` (`useUrlFilters`, `useEntityDrawer`, …)                     |
| Validation                                        | `shared/validation/`                                                        |
| Generic helpers                                   | `shared/lib/`                                                               |
| Shared types                                      | `shared/types/`                                                             |
| Global config                                     | `shared/config/`                                                            |
| Theme tokens                                      | `shared/theme/` (see `frontend-design-system`)                              |
| Business pages                                    | `features/<feature>/pages/`                                                 |
| Business components                               | `features/<feature>/components/`                                            |
| Business services                                 | `features/<feature>/api/`                                                   |
| Demo page                                         | Delete                                                                      |
| Mock API                                          | Prefer MSW handlers; delete unused template mocks                           |
| Hard-coded route                                  | `app/router/paths.ts`                                                       |

## Anti-patterns during migration

```text
src/template/     # permanent
src/app/
src/features/
src/shared/
```

Two architectures in parallel cause drift. Keep legacy only briefly, then delete.

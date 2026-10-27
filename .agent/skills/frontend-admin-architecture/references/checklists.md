# Checklists

## New feature

```text
[ ] Under src/features/<feature>
[ ] API quartet: types / service / hooks / index
[ ] All query hooks in one hooks.ts
[ ] No route file inside feature; paths + routes in app/router
[ ] No import from 'antd' or @/shared/adapters/*
[ ] UI only from @/shared/ui
[ ] Lists use DataTable + useUrlFilters when filters/paging are shareable
[ ] Forms use RHF + shared/validation + shared/ui fields
[ ] Permission keys come from shared/permissions catalog; feature config only combines them (*-access.ts)
[ ] Status single source
[ ] List query params extend shared ListQueryBase; response extends CommonApiResponse
[ ] Public index.ts; no external deep imports
[ ] Dependency direction OK
[ ] Page lazy-loaded in app/router
[ ] Backend authorizes the new endpoints (UI guards are UX only)
```

Deeper gates: `frontend-admin-security/references/checklist.md` and
`frontend-admin-performance`.

## AI pre-flight

1. Read structure; find existing `shared/ui` and hooks.
2. Do not import UI kits in features.
3. Prefer DataTable / AsyncState / useEntityDrawer / useUrlFilters / FileUploader.
4. Simplest sufficient implementation; no speculative code.
5. Register routes centrally; use ROUTES constants.
6. Never treat a hidden button or route guard as authorization.

## Summary

```text
app / features / shared
features → shared/ui only (not antd, not adapters)
DataTable = TanStack Table; Form = RHF + shared/validation
API quartet; routes in app/router; status single-source
Permission catalog + engine in shared/permissions; feature only declares access combos
```

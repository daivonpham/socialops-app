# API module rules

## service.ts must not contain

- `useQuery` / `useMutation` / any React hooks
- Ant Design `message` / `notification` / Modal APIs (or any UI kit toast/modal)
  — call those from hooks/UI via `@/shared/ui`, not from services
- `navigate` / router usage
- React state or JSX
- Permission checks

## hooks.ts must contain

- Feature query key factory
- List + detail queries
- Create / update / delete (and other domain mutations)
- Cache invalidation for those mutations
- Optional prefetch helpers

## Do not split hooks by file

Wrong:

```text
api/hooks/useGetOrders.ts
api/hooks/useCreateOrder.ts
```

Right: one `api/hooks.ts`.

If the file is huge because of a second business domain, create a **new feature**, not a hooks subdirectory.

## Types boundary

| Location               | Content                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| `shared/api/types.ts`  | Cross-feature contracts: `CommonApiResponse<T>`, `PaginationMeta`, `ListQueryBase`, `ListQuery<T>`              |
| `api/types.ts`         | Feature wire shapes only: DTOs, payloads, `GetXParams = ListQuery<{...}>` — extends shared, never redeclares it |
| `model/*.types.ts`     | UI / form / domain shapes that differ from API                                                                  |
| Component `*.types.ts` | Props-only types colocated with complex components                                                              |

Do not create a feature-local response wrapper (`OrderListResponse`,
`OrderDetailResponse`, …) when `CommonApiResponse<T>` already covers it — that is
the identity-wrapper pattern `frontend-code-simplicity` bans.

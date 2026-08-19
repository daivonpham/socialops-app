# Applying `react-best-practices` in an admin SPA

`react-best-practices` has 70 rules written primarily for React + **Next.js**.
A typical admin app is a client-rendered SPA (Vite or Next in client mode) behind
a login, so a meaningful part of that skill does not apply.

## Section relevance

| Section | Applies to a client-rendered admin? |
| --- | --- |
| 1. Eliminating waterfalls | Partly — the `Promise.all` and defer-await ideas apply to any async code; the Server Component and API-route examples do not |
| 2. Bundle size | **Yes**, fully — see [bundle.md](bundle.md) for the barrel caveat |
| 3. Server-side performance | **No** — RSC, `React.cache`, `after()`, server actions, RSC serialization |
| 4. Client-side data fetching | Partly — concepts apply, but this project uses **TanStack Query, not SWR** |
| 5. Re-render optimization | **Yes**, the most useful section here |
| 6. Rendering performance | Mostly — skip the hydration rules if there is no SSR |
| 7. JavaScript performance | Yes, but last priority; only with a measurement |
| 8. Advanced patterns | Yes, occasionally |

## Translation notes

- Where the skill says **SWR**, use the TanStack Query equivalent
  (`useQuery`, `staleTime`, `invalidateQueries`) — do not add SWR to the project.
- Where it says **`next/dynamic`**, use `React.lazy` + `Suspense` in a Vite SPA.
- Hydration rules (`rendering-hydration-*`, `suppressHydrationWarning`) are
  irrelevant without SSR.
- `client-localstorage-schema` is still good advice, but read
  `frontend-admin-security/references/data-exposure.md` first: in an admin app the
  question is usually whether the value should be in storage at all.

## If the project *is* Next.js

Then sections 1 and 3 apply in full, and the security rule
`server-auth-actions` becomes important — it is the server-side counterpart of the
authorization rule in `frontend-admin-security`.

## Priority order for an admin app

```text
1. Section 2 — bundle size
2. Section 5 — re-render
3. This skill's data-fetching and tables references
4. Section 6 — rendering
5. Section 7 — JavaScript micro-optimizations (only when measured)
```

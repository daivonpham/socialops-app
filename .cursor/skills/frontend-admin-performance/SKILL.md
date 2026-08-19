---
name: frontend-admin-performance
description: >-
  Performance rules specific to large admin SPAs: TanStack Query defaults and
  pagination without flicker, table virtualization thresholds, form re-render
  isolation, route code splitting, heavy dependency loading, and how to apply
  react-best-practices correctly in a non-Next.js app. Use when a list, table,
  form, dashboard, or search feels slow, or when reviewing bundle size. Triggers
  on "slow table", "virtualization", "keepPreviousData", "bundle size",
  "lazy route", "debounce search", "re-render".
license: MIT
metadata:
  author: local
  version: "1.0.0"
---

# Frontend Admin Performance

Admin performance problems are not the same as marketing-site problems. There is
no SEO, no cold LCP race, and users keep one tab open for hours. What hurts is
**large tables, wide forms, chatty refetching, and a bundle full of editors and
charts**.

## When to Apply

- A list, table, dashboard, or search feels slow
- Pagination flickers or resets scroll
- A form lags while typing
- Bundle size or first load is growing
- Deciding whether a `react-best-practices` rule applies to this project

## How It Works

1. Identify the symptom, then read the matching reference.
2. Measure before optimizing — React DevTools Profiler, Network tab, bundle report.
3. Apply the platform-level fix (in `shared/ui` / `shared/hooks`) so every feature benefits.
4. Do not add memoization or caching without a measured cause — see `frontend-code-simplicity`.

## References

| Symptom | Reference |
| --- | --- |
| Refetch storms, pagination flicker, slow search | [references/data-fetching.md](references/data-fetching.md) |
| Big tables, scroll jank, slow column render | [references/tables.md](references/tables.md) |
| Laggy typing, whole-form re-render | [references/forms-and-render.md](references/forms-and-render.md) |
| Large bundle, slow first load | [references/bundle.md](references/bundle.md) |
| Which `react-best-practices` rules apply here | [references/scope.md](references/scope.md) |

## Defaults worth setting once

```text
Query:   staleTime > 0, placeholderData: keepPreviousData on paginated lists
Table:   virtualize past ~100 visible rows; stable column identity
Form:    RHF uncontrolled fields; isolate watched values
Router:  every page lazy-loaded; heavy widgets dynamically imported
```

Each of these belongs in the platform layer, not repeated per feature.

## Order of impact

```text
1. Stop unnecessary requests        (staleTime, dedupe, debounce, enabled)
2. Stop unnecessary renders         (RHF isolation, stable props, split state)
3. Stop rendering unnecessary DOM   (virtualization, pagination)
4. Ship less JavaScript             (route splitting, heavy deps on demand)
5. Micro-optimizations              (loops, lookups) — last, and only if measured
```

Most admin slowness is fixed at steps 1–3. Reaching for `memo` first is the
common mistake.

## Output

Report the symptom, the measurement, the fix, and whether it was applied at the
platform level or in a single feature.

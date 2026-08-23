# `shared/components/ant` — antd adapters (INTERNAL)

This folder is the **only** place (besides `app/providers/ThemeProvider.tsx`)
allowed to import `antd` / `@ant-design/*` — ESLint enforces it. Features never
import from here; they import `@/shared/ui`, which re-exports these adapters.

## Adding the next component — 3-step recipe

1. **Declare primitive props in `src/shared/ui/primitives/<Component>.tsx`.**
   Define `<Component>Props` with platform-owned names (`variant`, `size`,
   `items`…), never re-export antd prop types. Type-only imports of this file
   from the adapter are fine (no runtime cycle).

2. **Implement the mapping in `src/shared/components/ant/<Component>.tsx`.**
   Import the antd widget + the platform props type, and map platform props →
   antd props. Visual values come from `theme.ts` (ConfigProvider tokens) or
   token-derived Tailwind classes — never a raw hex/px (those live only in
   `src/shared/styles/tokens.ts`). If antd fights the design (e.g. our `Badge`
   count pill, `NavItem`), implement the component kit-free in `shared/ui`
   instead and skip the adapter.

3. **Re-export from `shared/ui` and consume via `@/shared/ui`.**
   Add `export { Component } from '@/shared/components/ant/<Component>'` inside
   the primitive file from step 1, export it through
   `src/shared/ui/primitives/index.ts`, then expose that group through
   `src/shared/ui/index.ts`. Features/app import `@/shared/ui` only — run
   `npm run lint` to confirm no boundary is crossed.

Do **not** pre-wrap antd components nobody renders yet — wrap on first real use.

## Where a visual value is allowed to live

Follow design.md §41 in order and stop at the first level that works:

1. `theme.ts` → `token` (global) — affects every component
2. `theme.ts` → `components.<Kit>` — one component's tokens
3. Token-derived Tailwind classes passed by the adapter (e.g. the dropdown
   surface border/padding in `Dropdown.tsx`)
4. A kit-free implementation in `shared/ui`

Never reach for a global `.ant-*` selector, and never inline a hex/px.

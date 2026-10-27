# Bundle size

Admin apps accumulate weight quietly: an editor here, a chart library there, three
date libraries, and a full icon set.

## Route-level code splitting is mandatory

Every page in `app/router/routes.tsx` is lazily imported:

```tsx
const OrderListPage = lazy(() => import('@/features/orders/pages/OrderListPage'))
```

An admin with 60 screens must never ship all 60 in the initial chunk. Pair with a
Suspense fallback in the layout so navigation shows a skeleton, not a blank frame.

## Heavy dependencies load on demand

| Library type         | Typical cost | Load when                    |
| -------------------- | ------------ | ---------------------------- |
| Rich text editor     | 200–500 KB   | The editor screen opens      |
| Charting             | 100–300 KB   | The dashboard/widget renders |
| PDF / Excel          | 300 KB+      | The user clicks export       |
| Map                  | 200 KB+      | The map panel opens          |
| Code editor (Monaco) | 300 KB+      | The code panel opens         |

Import them with `import()` inside the component that needs them, not at module
top level of a shared file — a static import in `shared/ui/index.ts` pulls the
library into every route.

## The barrel file question

`react-best-practices` rule `bundle-barrel-imports` says to avoid barrel imports,
while this architecture requires `features/<name>/index.ts` and `shared/ui`
barrels. Both are correct, because they describe different things:

| Barrel                                                                                          | Verdict                                                                                   |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Your own `features/orders/index.ts`, `shared/ui/index.ts`                                       | **Keep.** Small, app-local, tree-shaken by the bundler. This is an architecture boundary. |
| Third-party barrels: `lucide-react`, `@mui/material`, `@ant-design/icons`, `lodash`, `date-fns` | **Avoid.** Thousands of re-exports; import the specific path or configure the bundler.    |

So the rule in practice: **barrel your own modules, never import a UI kit or icon
pack through its root barrel.**

Two things keep your own barrels cheap:

- Do not re-export something heavy from `shared/ui/index.ts` — export the heavy
  component from its own path and let features import it directly.
- Prefer explicit named re-exports over `export *` on large features.

## Icons

Import icons individually, or use the bundler's optimization for the pack. A root
import of an icon library is one of the largest silent additions to an admin
bundle.

## Duplicate libraries

Check for more than one of: date library, HTTP client, state library, icon pack,
validation library. Duplicates arrive through the UI kit and through copy-pasted
template code. Pick one of each and record it in the project README.

## Measure

```bash
npx vite-bundle-visualizer     # Vite
ANALYZE=true next build        # Next.js with the bundle analyzer
```

Set a budget for the initial chunk and check it in CI. Without a number in CI,
bundle size only moves in one direction.

## What not to bother with

Micro-optimizing your own module count, or splitting small components. The wins
are in routes and in third-party weight.

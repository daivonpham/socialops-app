# Adapters (`shared/adapters/<kit>`)

## Role

Implement or map UI-kit widgets for consumption **only** by `shared/ui`.

```text
shared/adapters/ant/Button.tsx
shared/adapters/ant/Input.tsx
shared/adapters/ant/Card.tsx
…
shared/ui/primitives/Button → uses adapter (or re-exports mapped component)
```

## Phase 1 — import firewall (allowed)

```tsx
import { Card as AntCard, type CardProps as AntCardProps } from 'antd'

// Prefer mapping to platform CardProps ASAP; thin wrap OK temporarily in adapters only
const Card = (props: AntCardProps) => <AntCard {...props} />
export default Card
```

## Phase 2 — platform props (target)

```tsx
// shared/ui/primitives/Card — public contract
export type CardProps = { title?: React.ReactNode; children?: React.ReactNode; padded?: boolean }

// shared/adapters/ant/Card — private mapping into Ant
```

## Rules

- Features import `{ Card }` from `@/shared/ui`, never primitives by deep path,
  adapters, or `antd`.
- ESLint-ban `antd` in `features/**`.
- Swapping kit = new `adapters/<other>` + point `shared/ui` at it — features unchanged if props are platform-owned.
- Passthrough exporting Ant types as the **forever** public API is insufficient for multi-design; treat as temporary.

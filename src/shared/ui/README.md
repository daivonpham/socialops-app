# Shared UI

`shared/ui` is the public, kit-agnostic UI API for features and app chrome.

## Structure

```text
shared/ui/
├── primitives/     # Button, Input, Select, Modal, icons...
├── AsyncState.tsx  # reusable composites
├── DataTable/      # TanStack engine + SocialOps table shell
├── charts/          # lazy Recharts components for dashboard data
├── StatusTag.tsx
├── Logo.tsx        # shared product components
├── NavItem.tsx
└── index.ts        # the only consumer entry point
```

## Placement rules

- Put low-level, domain-agnostic building blocks in `primitives/`.
- Put shared components that compose primitives or express a repeated UI
  pattern at the `shared/ui` root.
- Keep domain-specific components inside their feature.
- Features and app chrome import only from `@/shared/ui`; do not deep-import
  `primitives/` or the internal Ant adapter.
- Ant implementations remain internal to `shared/components/ant`.
- `BarChart` and `LineChart` are exported from `@/shared/ui`; their Recharts
  code is lazy-loaded only when a dashboard renders them.

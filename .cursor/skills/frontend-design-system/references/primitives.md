# Primitives

Low-level UI in `shared/ui`, backed by `shared/adapters/<kit>`.

Examples: `Button`, `Input`, `Select`, `Checkbox`, `Switch`, `Modal`, `Drawer`,
`Tooltip`, `Tag`, `Spinner`, `Text`, `Link`.

## Rules

- Public props are platform-owned (or migrating toward that).
- Accessible defaults (focus, keyboard, labels) live here once.
- No feature domain knowledge.
- Prefer composition over mega-props.

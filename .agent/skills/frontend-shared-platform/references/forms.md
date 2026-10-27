# Forms (React Hook Form)

## Stack

```text
React Hook Form          → form state
shared/validation        → schema + messages
@/shared/ui Input|Select… → field widgets (adapter-backed)
```

## Rules

- New forms must not use Ant `Form` / `Form.Item` as the engine.
- Wire fields with RHF (`Controller` / register) + platform inputs.
- Validate with schema from `shared/validation` or feature schema built on shared builders.
- Map API ↔ form via feature mappers when shapes differ.

## Anti-patterns

```tsx
// ✗ in features
import { Form } from 'antd'
;<Form.Item rules={[{ required: true }]} />
```

Keeping the uncontrolled/`useWatch` benefit, validation mode, and large selects:
`frontend-admin-performance/references/forms-and-render.md`.

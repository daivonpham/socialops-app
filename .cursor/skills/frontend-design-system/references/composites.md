# Composites

Built from primitives for repeated admin chrome.

Examples:

| Composite       | Role                                         |
| --------------- | -------------------------------------------- |
| `PageHeader`    | Title, description, primary actions slot     |
| `FilterBar`     | Consistent filter row layout                 |
| `ConfirmDialog` | Destructive confirm pattern                  |
| `StatusTag`     | Status → color/label from shared map helpers |
| `EmptyState`    | Used by `AsyncState` empty slot              |
| `FormSection`   | Grouped fields with title                    |

## Rules

- Composites stay domain-agnostic (slots for titles/actions).
- Domain-specific chrome stays in the feature (`OrderStatusTag` wrapping `StatusTag` with order statuses).
- Do not invent a second PageHeader in each feature.

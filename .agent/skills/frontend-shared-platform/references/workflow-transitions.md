# Workflow transitions

`model/*-status.ts` (see `frontend-admin-architecture`) owns **rendering** —
value, label, color, options. It says nothing about which status can move to
which, or what happens on the way. That is a different concern: a **state
machine**, one level up from a status enum.

Use this pattern whenever a domain has an approval/publish lifecycle (draft →
review → approved → scheduled → done, or similar), not for simple flags.

## Where it lives

```text
features/<feature>/model/
├── <feature>-status.ts       # value/label/color/options (rendering)
└── <feature>-transitions.ts  # allowed transitions + guards (behavior)
```

## Shape

```ts
// features/orders/model/order-transitions.ts
import type { OrderStatus } from './order-status'

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['pending_approval'],
  pending_approval: ['approved', 'rejected'],
  approved: ['scheduled', 'pending_approval'], // editing an approved item re-opens review
  rejected: ['pending_approval'],
  scheduled: ['published', 'failed'],
  published: [],
  failed: ['scheduled'],
}

export const canTransition = (from: OrderStatus, to: OrderStatus) =>
  ORDER_TRANSITIONS[from]?.includes(to) ?? false
```

Gate an action on **both** independent checks — permission (who) and state
(what point in the lifecycle):

```tsx
<Can allOf={ORDER_ACCESS.APPROVE}>
  {canTransition(order.status, 'approved') && (
    <Button onClick={() => approve(order.id)}>Approve</Button>
  )}
</Can>
```

## The transition map is UX, the backend is the state machine

Same principle as `authorization.md`: `ORDER_TRANSITIONS` only hides actions
that cannot succeed, so the UI does not offer dead-end buttons. The backend
must reject an invalid transition independently — never assume the frontend
map is the only guard.

Send **intent**, not the computed next status:

```text
✗ updateOrder({ id, status: 'approved' })          — client decides the new state
✓ approveOrder({ id })                              — server decides and returns the new state
```

Let the mutation response set the status shown in the UI; do not derive it
client-side and optimistically assume it matches. This also covers the common
rule "editing an approved/scheduled item reopens review" — that side effect
belongs to the backend action, not to a client `useEffect` that guesses when
to revert.

## Reason / comment on rejection

A rejecting transition usually needs a required note. Treat it as a normal
RHF field, conditionally required only for that one transition — do not build
a separate one-off "reject modal" form stack; reuse the platform form
primitives (`frontend-shared-platform/references/forms.md`).

## Anti-patterns

```text
✗ Computing "next status" in a component and passing it to a generic update endpoint
✗ Duplicating the transition map inline in every button instead of one shared file
✗ A transition map with no backend equivalent ("the frontend is more permissive than the API")
✗ Enabling a bulk action when only some selected rows can make that transition
```

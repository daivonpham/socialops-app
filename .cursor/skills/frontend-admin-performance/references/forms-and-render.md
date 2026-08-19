# Forms and re-render

## Why RHF is the performance choice

React Hook Form keeps fields uncontrolled, so typing in one field does not
re-render the whole form. A 40-field admin form built with controlled `useState`
re-renders every field on every keystroke.

This is the performance half of the architecture decision in
`frontend-shared-platform/references/forms.md`.

## Keep the uncontrolled benefit

```tsx
// ✗ subscribes the whole form to every change
const values = watch()

// ✓ subscribe to what you need
const status = useWatch({ control, name: 'status' })
```

`watch()` with no arguments re-renders the component on every keystroke anywhere
in the form — it undoes the reason you chose RHF.

Isolate conditional sections into child components that call `useWatch`
themselves, so only that subtree re-renders.

## Validation timing

```text
mode: 'onSubmit'  → cheapest, good default for large admin forms
mode: 'onBlur'    → good balance when users need early feedback
mode: 'onChange'  → validates on every keystroke; use only on small forms
```

Async validation (uniqueness checks) must be debounced and should not run on
every character.

## Large selects and autocompletes

A `<Select>` with 5,000 options renders 5,000 DOM nodes.

- Server-side search with debounce for anything above ~200 options
- Virtualize the option list in the platform component if it must be client-side
- Never render all options and rely on CSS to hide them

## Field arrays

Repeatable rows (order items, permission grids) grow fast. Give each row a stable
key from RHF's field `id`, not the array index — index keys remount rows on
insert/remove and lose focus and state.

## When to reach for memo

Only after the Profiler shows a real cost. In order:

1. Is the component re-rendering because a parent re-renders unnecessarily? Fix the parent.
2. Is a prop a new object/array/function each render? Stabilize it.
3. Is the render genuinely expensive? Then `memo`.

`frontend-code-simplicity` bans speculative memoization; this is the exception path
that justifies it. If the project has React Compiler enabled, skip manual memo
entirely.

## Modals and drawers

Mount their content on open. A drawer whose heavy form is mounted (just hidden)
for every row in a table pays that cost on every list render.

## Detailed rules

For general React re-render rules (derived state, effect dependencies, functional
setState, inline components), use `react-best-practices` section 5 — see
[scope.md](scope.md) for which sections apply here.

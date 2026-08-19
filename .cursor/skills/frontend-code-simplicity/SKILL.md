---
name: frontend-code-simplicity
description: >-
  Enforce reuse-first and simplicity-first coding for Frontend Admin apps. Use
  when writing or reviewing React/TypeScript admin code to avoid overengineering,
  speculative validators, unused wrappers/mappers, scope creep, and duplicate
  generics. Triggers on "keep it simple", "no overengineering", "reuse existing
  components", "don't add speculative code", PR review for complexity.
license: MIT
metadata:
  author: local
  version: "2.0.0"
---

# Frontend Code Simplicity

Companion to `frontend-admin-architecture` / `frontend-shared-platform`.
Architecture defines **where** code goes; this skill defines **how little**
code to write.

## When to Apply

- Implementing any admin feature change
- Reviewing PRs for unnecessary abstraction
- Resisting AI tendency to add “enterprise” boilerplate

## How It Works

1. Search the repo for an existing solution (component, hook, helper, schema).
2. Reuse or lightly extend it.
3. Choose the simplest implementation that meets the **current** requirement.
4. Refuse speculative edge cases, wrappers, and refactors outside scope.
5. Prefer platform primitives (`shared/ui`, `useUrlFilters`, `AsyncState`) and
   library engines (TanStack Query/Table, RHF, Zod) over custom clones.

## Mandatory Rules

### Reuse-first

```text
Search before create.
Reuse before duplicate.
Extend before replace.
```

Applies to: DataTable, FilterBar, modal/drawer, StatusTag, permission helpers,
pagination, query helpers, AsyncState, FileUploader, validation builders.

### Simplicity-first

Prefer short, direct code. Example — use a shared Zod `required` / schema builder
(or RHF + existing `shared/validation` rule) instead of inventing a one-off
validator for the same behavior. Do **not** reach for Ant `Form.Item` `rules`
in features — forms go through RHF + platform fields.

### No speculative defensive code

Do not add without evidence (requirement, bug, API contract, existing behavior):

- Custom validators / multi-layer fallbacks
- Empty try/catch
- Identity mappers / adapters / passthrough wrappers
- Extra state + syncing effects
- Memoization / retry / backward-compat shims “just in case”
- One-off helpers that make code harder to follow

### Prefer library + platform APIs

TanStack Query already provides `enabled`, `staleTime`, `invalidateQueries`,
`select`. RHF + Zod already cover form state/validation. `useUrlFilters` /
`AsyncState` / `DataTable` cover list-page plumbing. Do not reimplement them.

### No early abstraction

Extract a helper only when at least one is true:

1. Reused
2. Domain-meaningful
3. Non-trivial complexity
4. Clearly more readable extracted
5. Needs isolated tests

### No out-of-scope refactor

- Only change what the task needs
- Do not mass-rename or restructure nearby code
- Do not replace existing generics with a new parallel system
- Call out unrelated issues; do not silently “fix” them

### Short code wins

Prefer fewer abstractions, fewer states, fewer effects, fewer casts, fewer wrappers.
Large projects need **clear boundaries**, not long code.

## Present Results

When refusing overengineering, say briefly what you skipped and what existing
primitive you reused instead.

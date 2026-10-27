# Page patterns

Layout recipes — usually implemented as light layout components or documented structure.

## List page

```text
PageHeader
FilterBar (wired to useUrlFilters)
AsyncState
  DataTable
```

## Form page / drawer form

```text
PageHeader or Drawer header
RHF form + FormSection(s)
Footer actions (submit/cancel via shared Button)
```

## Detail page

```text
PageHeader + actions
AsyncState
  sections of read-only fields / related tables
```

## Rules

- Patterns describe structure; features fill slots with domain content.
- Do not pack API calls into pattern components — keep data in feature hooks.
- Prefer one ListPage recipe project-wide so admins feel consistent.

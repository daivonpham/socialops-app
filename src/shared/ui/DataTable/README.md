# DataTable

Headless TanStack Table v9 engine with SocialOps-owned semantic markup and
`design.md` styling. It does not import Ant Table.

## Included behavior

- client or controlled/server sorting
- controlled or internal row selection, including Shift-range selection
- controlled or internal column visibility
- controlled or internal column ordering
- optional built-in column settings dropdown (`showColumnSettings`) for visibility and ordering
- pointer drag-and-drop column reordering in the settings dropdown
- pointer/touch and keyboard column resizing
- client or controlled/server pagination
- controlled column and global filtering
- responsive horizontal overflow, sticky headers and empty state

Feature code imports `DataTable` and its platform-owned types from
`@/shared/ui`. Do not import TanStack types into features.

For server datasets, set the corresponding `manualSorting`, `manualFiltering`
and `pagination.mode = 'server'` flags and drive API/query state through the
matching controlled callbacks.

Set `showColumnSettings` only on tables that should expose this end-user
configuration. Omit it for a regular table without the toolbar control.

Set `columnPersistenceKey` to retain the chosen column order, widths and hidden columns in this browser.
For example, `columnPersistenceKey="facebook-posts"` stores the order under
`socialops:data-table:column-order:facebook-posts`. A controlled
`columnOrder` always takes precedence over browser storage.

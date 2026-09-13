import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  columnFilteringFeature,
  columnOrderingFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  functionalUpdate,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ReactTable,
  type RowSelectionState,
  type SortingState,
  type TableState,
} from '@tanstack/react-table'
import { componentToken } from '@/shared/styles/tokens'
import { Button } from '../primitives/Button'
import { Checkbox } from '../primitives/Checkbox'
import { Dropdown } from '../primitives/Dropdown'
import { Select } from '../primitives/Select'
import {
  IconArrowDown,
  IconArrowUp,
  IconCaretUpDown,
  IconDrag,
  IconFilter,
  IconRefresh,
  IconSettings,
} from '../primitives/icons'
import type {
  DataTableAlignment,
  DataTableColumn,
  DataTableColumnFilter,
  DataTablePagination,
  DataTableProps,
  DataTableSorting,
} from './types'

const SELECTION_COLUMN_ID = '__selection'
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
const EMPTY_ROW_SELECTION: RowSelectionState = {}
const EMPTY_VISIBILITY: Record<string, boolean> = {}
const EMPTY_SORTING: SortingState = []
const EMPTY_FILTERS: ColumnFiltersState = []
const EMPTY_COLUMN_SIZING: Record<string, number> = {}
const COLUMN_ORDER_STORAGE_PREFIX = 'socialops:data-table:column-order:'
const COLUMN_SIZING_STORAGE_PREFIX = 'socialops:data-table:column-sizing:'

type DataTableColumnMeta = {
  align: DataTableAlignment
  fixed?: 'left' | 'right'
  label: string
  reorderable: boolean
}

function resolveColumnSize<T>(column: DataTableColumn<T>) {
  return column.size ?? componentToken.table.columnPreset[column.width ?? 'default']
}

const DATA_TABLE_FEATURES = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  columnOrderingFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, text: sortFn_text },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnMeta: {} as DataTableColumnMeta,
})

const ALIGN_CLASS: Record<DataTableAlignment, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
}

const CELL_PADDING_CLASS = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
} as const

const SELECTION_CELL_PADDING_CLASS = {
  sm: 'px-1 py-2',
  md: 'px-1 py-3',
} as const

function toRowSelection(selection?: Record<string, boolean>): RowSelectionState {
  if (!selection) return EMPTY_ROW_SELECTION
  return Object.fromEntries(
    Object.entries(selection)
      .filter(([, selected]) => selected)
      .map(([id]) => [id, true] as const),
  )
}

function toSorting(sorting?: DataTableSorting[]): SortingState {
  if (!sorting) return EMPTY_SORTING
  return sorting.map(({ columnKey, direction }) => ({ id: columnKey, desc: direction === 'desc' }))
}

function fromSorting(sorting: SortingState): DataTableSorting[] {
  return sorting.map(({ id, desc }) => ({ columnKey: id, direction: desc ? 'desc' : 'asc' }))
}

function toColumnFilters(filters?: DataTableColumnFilter[]): ColumnFiltersState {
  if (!filters) return EMPTY_FILTERS
  return filters.map(({ columnKey, value }) => ({ id: columnKey, value }))
}

function fromColumnFilters(filters: ColumnFiltersState): DataTableColumnFilter[] {
  return filters.map(({ id, value }) => ({ columnKey: id, value }))
}

function completeColumnOrder(
  order: readonly string[],
  columnKeys: readonly string[],
  selectable: boolean,
) {
  const allowed = new Set(columnKeys)
  const ordered = [...new Set(order.filter((key) => allowed.has(key)))]
  const missing = columnKeys.filter((key) => !ordered.includes(key))
  return selectable ? [SELECTION_COLUMN_ID, ...ordered, ...missing] : [...ordered, ...missing]
}

function readPersistedColumnOrder(key?: string): string[] | undefined {
  if (!key || typeof window === 'undefined') return undefined
  try {
    const value = window.localStorage.getItem(`${COLUMN_ORDER_STORAGE_PREFIX}${key}`)
    if (!value) return undefined
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) && parsed.every((column) => typeof column === 'string')
      ? parsed
      : undefined
  } catch {
    return undefined
  }
}

function persistColumnOrder(key: string, order: string[]) {
  try {
    window.localStorage.setItem(`${COLUMN_ORDER_STORAGE_PREFIX}${key}`, JSON.stringify(order))
  } catch {
    // Storage may be unavailable in private browsing; the table remains usable for this session.
  }
}

function readPersistedColumnSizing(key?: string): Record<string, number> {
  if (!key || typeof window === 'undefined') return EMPTY_COLUMN_SIZING
  try {
    const value = window.localStorage.getItem(`${COLUMN_SIZING_STORAGE_PREFIX}${key}`)
    if (!value) return EMPTY_COLUMN_SIZING
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return EMPTY_COLUMN_SIZING
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0,
      ),
    )
  } catch {
    return EMPTY_COLUMN_SIZING
  }
}

function persistColumnSizing(key: string, sizing: Record<string, number>) {
  try {
    window.localStorage.setItem(`${COLUMN_SIZING_STORAGE_PREFIX}${key}`, JSON.stringify(sizing))
  } catch {
    // Storage may be unavailable; resizing still works for the current session.
  }
}

function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function getColumnLabel<T>(column: DataTableColumn<T>) {
  return column.label ?? (typeof column.title === 'string' ? column.title : column.key)
}

export function DataTable<T extends object>({
  data,
  columns,
  getRowId,
  title,
  ariaLabel,
  density = 'md',
  stickyHeader = false,
  emptyState,
  rowSelection,
  onRowSelectionChange,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  columnPersistenceKey,
  sorting,
  onSortingChange,
  manualSorting = false,
  columnFilters,
  onColumnFiltersChange,
  globalFilter,
  onGlobalFilterChange,
  manualFiltering = false,
  pagination,
  onPaginationChange,
  showColumnSettings = false,
  enableColumnReordering = true,
  enableColumnResizing = true,
  enableMultiSort = true,
  onRowClick,
}: DataTableProps<T>) {
  const { t } = useTranslation('common')
  const selectable = Boolean(rowSelection || onRowSelectionChange)
  const columnKeys = useMemo(() => columns.map((column) => column.key), [columns])
  const [persistedColumnOrder, setPersistedColumnOrder] = useState(() =>
    readPersistedColumnOrder(columnPersistenceKey),
  )
  const [persistedColumnSizing, setPersistedColumnSizing] = useState(() =>
    readPersistedColumnSizing(columnPersistenceKey),
  )
  const shouldPersistColumnOrder = Boolean(columnPersistenceKey && columnOrder === undefined)
  const controlledRowSelection = useMemo(() => toRowSelection(rowSelection), [rowSelection])
  const controlledSorting = useMemo(() => toSorting(sorting), [sorting])
  const controlledFilters = useMemo(() => toColumnFilters(columnFilters), [columnFilters])
  const controlledColumnOrder = useMemo(
    () =>
      completeColumnOrder(
        columnOrder ?? (shouldPersistColumnOrder ? persistedColumnOrder : undefined) ?? columnKeys,
        columnKeys,
        selectable,
      ),
    [columnKeys, columnOrder, persistedColumnOrder, selectable, shouldPersistColumnOrder],
  )

  const tanstackColumns = useMemo<Array<ColumnDef<typeof DATA_TABLE_FEATURES, T, unknown>>>(() => {
    const mapped = columns.map((column): ColumnDef<typeof DATA_TABLE_FEATURES, T, unknown> => {
      const accessor =
        column.accessor ?? (column.dataIndex ? (row: T) => row[column.dataIndex!] : undefined)
      const definition = {
        id: column.key,
        header: () => column.title,
        cell: ({ getValue, row }: { getValue: () => unknown; row: { original: T } }) =>
          column.render ? column.render(getValue(), row.original) : renderValue(getValue()),
        enableSorting: column.sortable ?? false,
        sortFn: column.sortType ?? 'auto',
        enableHiding: column.hideable ?? true,
        enableResizing: column.resizable ?? true,
        enableGlobalFilter: column.globalFilterable ?? Boolean(accessor),
        size: resolveColumnSize(column),
        minSize: column.minSize ?? componentToken.table.columnMinWidth,
        maxSize: column.maxSize ?? componentToken.table.columnMaxWidth,
        meta: {
          align: column.align ?? 'start',
          fixed: column.fixed,
          label: getColumnLabel(column),
          reorderable: column.reorderable ?? true,
        },
      }

      return accessor ? { ...definition, accessorFn: accessor } : definition
    })

    if (!selectable) return mapped

    return [
      {
        id: SELECTION_COLUMN_ID,
        header: ({ table }) => (
          <Checkbox
            aria-label={t('dataTable.selectAllRows')}
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()}
            onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={t('dataTable.selectRow')}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onClick={(event) => {
              event.stopPropagation()
              row.getToggleSelectedHandler()(event)
            }}
          />
        ),
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        size: componentToken.table.selectionColumnWidth,
        minSize: componentToken.table.selectionColumnWidth,
        maxSize: componentToken.table.selectionColumnWidth,
        meta: { align: 'center', label: t('dataTable.selectionColumn'), reorderable: false },
      },
      ...mapped,
    ]
  }, [columns, selectable, t])

  const state = useMemo<Partial<TableState<typeof DATA_TABLE_FEATURES>>>(
    () => ({
      ...(rowSelection !== undefined ? { rowSelection: controlledRowSelection } : {}),
      ...(columnVisibility !== undefined ? { columnVisibility } : {}),
      ...(columnOrder !== undefined || shouldPersistColumnOrder
        ? { columnOrder: controlledColumnOrder }
        : {}),
      ...(columnPersistenceKey ? { columnSizing: persistedColumnSizing } : {}),
      ...(sorting !== undefined ? { sorting: controlledSorting } : {}),
      ...(columnFilters !== undefined ? { columnFilters: controlledFilters } : {}),
      ...(globalFilter !== undefined ? { globalFilter } : {}),
      ...(pagination
        ? { pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize } }
        : {}),
    }),
    [
      columnFilters,
      columnOrder,
      columnVisibility,
      controlledColumnOrder,
      controlledFilters,
      controlledRowSelection,
      controlledSorting,
      globalFilter,
      pagination,
      persistedColumnSizing,
      rowSelection,
      shouldPersistColumnOrder,
      sorting,
    ],
  )

  const table = useTable({
    features: DATA_TABLE_FEATURES,
    data,
    columns: tanstackColumns,
    getRowId,
    state,
    initialState: {
      columnOrder: controlledColumnOrder,
      columnSizing: persistedColumnSizing,
      columnVisibility: columnVisibility ?? EMPTY_VISIBILITY,
      rowSelection: controlledRowSelection,
      sorting: controlledSorting,
      columnFilters: controlledFilters,
      globalFilter,
      pagination: {
        pageIndex: pagination?.pageIndex ?? 0,
        pageSize: pagination?.pageSize ?? Infinity,
      },
    },
    defaultColumn: {
      size: componentToken.table.columnWidth,
      minSize: componentToken.table.columnMinWidth,
      maxSize: componentToken.table.columnMaxWidth,
    },
    enableColumnResizing,
    columnResizeMode: 'onChange',
    enableHiding: true,
    enableMultiSort,
    enableRowSelection: selectable,
    enableRowRangeSelection: true,
    manualFiltering,
    globalFilterFn: 'includesString',
    manualSorting,
    manualPagination: !pagination || pagination.mode === 'server',
    rowCount: pagination?.rowCount,
    pageCount: pagination?.pageCount,
    onRowSelectionChange: onRowSelectionChange
      ? (updater) => onRowSelectionChange(functionalUpdate(updater, controlledRowSelection))
      : undefined,
    onColumnVisibilityChange: onColumnVisibilityChange
      ? (updater) =>
          onColumnVisibilityChange(functionalUpdate(updater, columnVisibility ?? EMPTY_VISIBILITY))
      : undefined,
    onColumnOrderChange:
      onColumnOrderChange || shouldPersistColumnOrder
        ? (updater) => {
            const next = completeColumnOrder(
              functionalUpdate(updater, controlledColumnOrder),
              columnKeys,
              selectable,
            ).filter((key) => key !== SELECTION_COLUMN_ID)
            if (shouldPersistColumnOrder && columnPersistenceKey) {
              setPersistedColumnOrder(next)
              persistColumnOrder(columnPersistenceKey, next)
            }
            onColumnOrderChange?.(next)
          }
        : undefined,
    onColumnSizingChange: columnPersistenceKey
      ? (updater) => {
          const next = functionalUpdate(updater, persistedColumnSizing)
          setPersistedColumnSizing(next)
          persistColumnSizing(columnPersistenceKey, next)
        }
      : undefined,
    onSortingChange: onSortingChange
      ? (updater) => onSortingChange(fromSorting(functionalUpdate(updater, controlledSorting)))
      : undefined,
    onColumnFiltersChange: onColumnFiltersChange
      ? (updater) =>
          onColumnFiltersChange(fromColumnFilters(functionalUpdate(updater, controlledFilters)))
      : undefined,
    onGlobalFilterChange: onGlobalFilterChange
      ? (updater) => onGlobalFilterChange(String(functionalUpdate(updater, globalFilter ?? '')))
      : undefined,
    onPaginationChange:
      onPaginationChange && pagination
        ? (updater) =>
            onPaginationChange(
              functionalUpdate(updater, {
                pageIndex: pagination.pageIndex,
                pageSize: pagination.pageSize,
              }),
            )
        : undefined,
  })

  const moveColumn = (activeId: string, targetId: string) => {
    if (
      activeId === targetId ||
      activeId === SELECTION_COLUMN_ID ||
      targetId === SELECTION_COLUMN_ID
    )
      return
    table.setColumnOrder((current) => {
      const allIds = table.getAllLeafColumns().map((column) => column.id)
      const complete = [...current, ...allIds.filter((id) => !current.includes(id))]
      const next = complete.filter((id) => id !== activeId)
      const targetIndex = next.indexOf(targetId)
      if (targetIndex < 0) return complete
      next.splice(targetIndex, 0, activeId)
      return next
    })
  }

  const resetColumns = () => {
    table.setColumnOrder(columnKeys)
    if (columnPersistenceKey) {
      setPersistedColumnSizing(EMPTY_COLUMN_SIZING)
      window.localStorage.removeItem(`${COLUMN_SIZING_STORAGE_PREFIX}${columnPersistenceKey}`)
    }
  }

  const visibleColumnCount = table.getVisibleLeafColumns().length
  const paddingClass = CELL_PADDING_CLASS[density]
  const selectionPaddingClass = SELECTION_CELL_PADDING_CLASS[density]
  const rows = table.getRowModel().rows

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border-subtle bg-bg-surface shadow-xs">
      {title || showColumnSettings ? (
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border-subtle px-4 py-2">
          {title ? (
            <h2 className="min-w-0 truncate text-heading-3 text-text-primary">{title}</h2>
          ) : (
            <span />
          )}
          {showColumnSettings ? (
            <Dropdown
              placement="bottomRight"
              content={
                <DataTableColumnSettings
                  table={table}
                  moveColumn={moveColumn}
                  resetColumns={resetColumns}
                  enableColumnReordering={enableColumnReordering}
                />
              }
            >
              <Button
                size="sm"
                variant="ghost"
                icon={<IconSettings />}
                aria-label={t('dataTable.columnSettings')}
                title={t('dataTable.columnSettings')}
              />
            </Dropdown>
          ) : null}
        </div>
      ) : null}
      <div className="app-scrollbar min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
        <table
          aria-label={ariaLabel}
          className="min-w-full table-fixed border-collapse text-body-sm text-text-secondary"
          style={{ width: table.getTotalSize() }}
        >
          <colgroup>
            {table.getVisibleLeafColumns().map((column) => (
              <col key={column.id} style={{ width: column.getSize() }} />
            ))}
          </colgroup>
          <thead className={stickyHeader ? 'sticky top-0 z-sticky' : undefined}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border-subtle bg-bg-surface-subtle"
              >
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                  const sourceColumn = columns.find((column) => column.key === header.column.id)
                  const sorted = header.column.getIsSorted()
                  const filterActive = Boolean(
                    sourceColumn?.filterValue !== undefined &&
                      sourceColumn.filterValue !== (sourceColumn.filterDefaultValue ?? ''),
                  )
                  const canResize = enableColumnResizing && header.column.getCanResize()
                  const minSize =
                    header.column.columnDef.minSize ?? componentToken.table.columnMinWidth
                  const maxSize =
                    header.column.columnDef.maxSize ?? componentToken.table.columnMaxWidth
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'
                      }
                      className={`${header.column.id === SELECTION_COLUMN_ID ? selectionPaddingClass : paddingClass} relative font-medium text-text-tertiary ${ALIGN_CLASS[meta?.align ?? 'start']} ${meta?.fixed ? 'z-base bg-bg-surface-subtle' : ''} ${meta?.fixed === 'right' ? 'border-s border-border-subtle' : meta?.fixed === 'left' ? 'border-e border-border-subtle' : ''}`}
                      style={{
                        width: header.getSize(),
                        ...(meta?.fixed === 'right'
                          ? { position: 'sticky', right: 0 }
                          : meta?.fixed === 'left'
                            ? { position: 'sticky', left: 0 }
                            : {}),
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex min-w-0 items-center gap-2 ${meta?.align === 'end' ? 'justify-end' : meta?.align === 'center' ? 'justify-center' : ''}`}
                        >
                          {header.column.getCanSort() ? (
                            <Dropdown
                              placement={meta?.align === 'end' ? 'bottomRight' : 'bottomLeft'}
                              selectedKey={sorted || undefined}
                              items={[
                                {
                                  key: 'asc',
                                  label: t('dataTable.sortAscending'),
                                  icon: <IconArrowUp />,
                                },
                                {
                                  key: 'desc',
                                  label: t('dataTable.sortDescending'),
                                  icon: <IconArrowDown />,
                                },
                                { type: 'divider' },
                                { key: 'clear', label: t('dataTable.clearSorting') },
                              ]}
                              onSelect={(key) => {
                                if (key === 'clear') {
                                  header.column.clearSorting()
                                  return
                                }
                                header.column.toggleSorting(key === 'desc', false)
                              }}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="min-w-0"
                                aria-label={t('dataTable.sortColumn', {
                                  column: meta?.label ?? header.column.id,
                                })}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <span className="truncate">
                                    <table.FlexRender header={header} />
                                  </span>
                                  <span aria-hidden className="shrink-0 text-icon-sm">
                                    {sorted === 'asc' ? (
                                      <IconArrowUp />
                                    ) : sorted === 'desc' ? (
                                      <IconArrowDown />
                                    ) : (
                                      <IconCaretUpDown />
                                    )}
                                  </span>
                                </span>
                              </Button>
                            </Dropdown>
                          ) : (
                            <span className="truncate">
                              <table.FlexRender header={header} />
                            </span>
                          )}
                          {sourceColumn?.filterOptions?.length ? (
                            <Dropdown
                              placement={meta?.align === 'end' ? 'bottomRight' : 'bottomLeft'}
                              selectedKey={sourceColumn.filterValue}
                              items={sourceColumn.filterOptions.map((option) => ({
                                key: option.value,
                                label: option.label,
                              }))}
                              onSelect={(value) => sourceColumn.onFilterChange?.(value)}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={
                                  <IconFilter
                                    className={filterActive ? 'text-action-text' : undefined}
                                  />
                                }
                                aria-label={t('dataTable.filterColumn', {
                                  column: meta?.label ?? header.column.id,
                                })}
                                title={t('dataTable.filterColumn', {
                                  column: meta?.label ?? header.column.id,
                                })}
                              />
                            </Dropdown>
                          ) : null}
                        </div>
                      )}
                      {canResize ? (
                        <span
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={t('dataTable.resizeColumn', {
                            column: meta?.label ?? header.column.id,
                          })}
                          aria-valuemin={minSize}
                          aria-valuemax={maxSize}
                          aria-valuenow={header.column.getSize()}
                          tabIndex={0}
                          className={`absolute inset-y-0 right-0 z-base flex w-2 cursor-col-resize items-center justify-center outline-none focus-visible:focus-ring ${
                            header.column.getIsResizing() ? 'bg-action-subtle' : ''
                          }`}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onDoubleClick={() => header.column.resetSize()}
                          onKeyDown={(event) => {
                            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                            event.preventDefault()
                            const direction = event.key === 'ArrowLeft' ? -1 : 1
                            table.setColumnSizing((current) => ({
                              ...current,
                              [header.column.id]: Math.min(
                                maxSize,
                                Math.max(
                                  minSize,
                                  header.column.getSize() +
                                    direction * componentToken.table.keyboardResizeStep,
                                ),
                              ),
                            }))
                          }}
                        >
                          <span aria-hidden className="h-6 w-px bg-border-subtle" />
                        </span>
                      ) : null}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  data-selected={row.getIsSelected() || undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={`group border-b border-border-subtle transition-colors duration-fast last:border-b-0 hover:bg-bg-surface-subtle data-[selected=true]:bg-action-subtle ${
                    onRowClick ? 'cursor-pointer focus-visible:focus-ring' : ''
                  }`}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.preventDefault()
                          onRowClick(row.original)
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta
                    const fixed = meta?.fixed
                    return (
                      <td
                        key={cell.id}
                        className={`${cell.column.id === SELECTION_COLUMN_ID ? selectionPaddingClass : paddingClass} overflow-hidden ${ALIGN_CLASS[meta?.align ?? 'start']} ${fixed ? 'z-base bg-bg-surface group-hover:bg-bg-surface-subtle group-data-[selected=true]:bg-action-subtle' : ''} ${fixed === 'right' ? 'border-s border-border-subtle' : fixed === 'left' ? 'border-e border-border-subtle' : ''}`}
                        style={{
                          width: cell.column.getSize(),
                          ...(fixed === 'right'
                            ? { position: 'sticky', right: 0 }
                            : fixed === 'left'
                              ? { position: 'sticky', left: 0 }
                              : {}),
                        }}
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={visibleColumnCount}
                  className="px-4 py-10 text-center text-body-sm text-text-tertiary"
                >
                  {emptyState ?? t('dataTable.noRows')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination ? (
        <DataTablePaginationBar
          table={table}
          pagination={pagination}
          rowCount={table.getRowCount()}
        />
      ) : null}
    </div>
  )
}

function DataTableColumnSettings<T extends object>({
  table,
  moveColumn,
  resetColumns,
  enableColumnReordering,
}: {
  table: ReactTable<typeof DATA_TABLE_FEATURES, T>
  moveColumn: (activeId: string, targetId: string) => void
  resetColumns: () => void
  enableColumnReordering: boolean
}) {
  const { t } = useTranslation('common')
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
  const columns = table.getAllLeafColumns().filter((column) => column.id !== SELECTION_COLUMN_ID)

  return (
    <section
      aria-label={t('dataTable.columnSettings')}
      className="w-table-settings overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
        <h3 className="text-label-md text-text-primary">{t('dataTable.columnSettings')}</h3>
        <Button
          size="sm"
          variant="ghost"
          icon={<IconRefresh />}
          aria-label={t('dataTable.resetColumns')}
          title={t('dataTable.resetColumns')}
          onClick={resetColumns}
        />
      </div>
      <div className="app-scrollbar max-h-table-settings overflow-y-auto p-2">
        {columns.map((column) => {
          const meta = column.columnDef.meta
          const canReorder = enableColumnReordering && meta?.reorderable !== false
          const isDragOver = dragOverColumnId === column.id && draggingColumnId !== column.id
          const label = meta?.label ?? column.id
          return (
            <div
              key={column.id}
              draggable={canReorder}
              className={`flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 transition-colors duration-fast ${
                canReorder ? 'cursor-grab' : ''
              } ${isDragOver ? 'bg-action-subtle' : 'hover:bg-bg-surface-muted'}`}
              onDragStart={(event) => {
                if (!canReorder) return
                setDraggingColumnId(column.id)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', column.id)
              }}
              onDragOver={(event) => {
                if (!canReorder || !draggingColumnId) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setDragOverColumnId(column.id)
              }}
              onDrop={(event) => {
                if (!canReorder) return
                event.preventDefault()
                const activeId = event.dataTransfer.getData('text/plain') || draggingColumnId
                if (activeId) moveColumn(activeId, column.id)
                setDraggingColumnId(null)
                setDragOverColumnId(null)
              }}
              onDragEnd={() => {
                setDraggingColumnId(null)
                setDragOverColumnId(null)
              }}
            >
              <Checkbox
                aria-label={t('dataTable.toggleColumn', { column: label })}
                checked={column.getIsVisible()}
                disabled={!column.getCanHide()}
                onChange={(event) => column.toggleVisibility(event.target.checked)}
              />
              <span className="min-w-0 flex-1 truncate text-body-sm text-text-primary">
                {label}
              </span>
              {canReorder ? (
                <span
                  aria-hidden
                  title={t('dataTable.reorderHint')}
                  className="shrink-0 text-icon-sm text-text-tertiary"
                >
                  <IconDrag />
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function DataTablePaginationBar<T extends object>({
  table,
  pagination,
  rowCount,
}: {
  table: ReactTable<typeof DATA_TABLE_FEATURES, T>
  pagination: DataTablePagination
  rowCount: number
}) {
  const { t } = useTranslation('common')
  const pageCount = table.getPageCount()
  const pageSizeOptions = pagination.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS
  const currentPage = pagination.pageIndex + 1

  return (
    <div className="flex flex-col gap-3 border-t border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-caption text-text-tertiary">
        {t('dataTable.pageSummary', {
          page: currentPage,
          pageCount: Math.max(pageCount, 1),
          rowCount,
        })}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label={t('dataTable.rowsPerPage')}
          value={String(pagination.pageSize)}
          options={pageSizeOptions.map((size) => ({
            value: String(size),
            label: t('dataTable.rowsCount', { count: size }),
          }))}
          onChange={(event) => table.setPageSize(Number(event.target.value))}
        />
        <Button
          size="sm"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          {t('dataTable.previousPage')}
        </Button>
        <Button size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
          {t('dataTable.nextPage')}
        </Button>
      </div>
    </div>
  )
}

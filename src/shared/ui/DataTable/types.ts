import type { ReactNode } from 'react'

export type DataTableAlignment = 'start' | 'center' | 'end'
export type DataTableColumnFixed = 'left' | 'right'
export type DataTableSortDirection = 'asc' | 'desc'
export type DataTableSortType = 'auto' | 'alphanumeric' | 'text' | 'basic'
export type DataTableColumnWidth = 'actions' | 'compact' | 'default' | 'wide' | 'content'

export type DataTableColumnFilterOption = {
  value: string
  label: ReactNode
}

export type DataTableColumn<T> = {
  key: string
  title: ReactNode
  /** Plain-text name used by assistive technology when `title` is rich JSX. */
  label?: string
  dataIndex?: keyof T
  accessor?: (row: T, index: number) => unknown
  render?: (value: unknown, row: T) => ReactNode
  sortable?: boolean
  sortType?: DataTableSortType
  filterOptions?: readonly DataTableColumnFilterOption[]
  filterValue?: string
  filterDefaultValue?: string
  onFilterChange?: (value: string) => void
  hideable?: boolean
  reorderable?: boolean
  resizable?: boolean
  globalFilterable?: boolean
  align?: DataTableAlignment
  fixed?: DataTableColumnFixed
  width?: DataTableColumnWidth
  size?: number
  minSize?: number
  maxSize?: number
}

export type DataTableSorting = {
  columnKey: string
  direction: DataTableSortDirection
}

export type DataTableColumnFilter = {
  columnKey: string
  value: unknown
}

export type DataTablePagination = {
  pageIndex: number
  pageSize: number
  /** Set `server` when `data` already contains only the requested page. */
  mode?: 'client' | 'server'
  rowCount?: number
  pageCount?: number
  pageSizeOptions?: readonly number[]
}

export type DataTableProps<T extends object> = {
  data: readonly T[]
  columns: readonly DataTableColumn<T>[]
  getRowId: (row: T) => string
  title?: ReactNode
  /** Controls beside the title, such as a search box. */
  toolbar?: ReactNode
  ariaLabel?: string
  density?: 'sm' | 'md'
  /** Rows scroll inside the table under a fixed header; the table fills the height its parent allows. */
  stickyHeader?: boolean
  emptyState?: ReactNode
  rowSelection?: Record<string, boolean>
  onRowSelectionChange?: (selection: Record<string, boolean>) => void
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
  /** Browser-local key used to persist the column order. */
  columnPersistenceKey?: string
  sorting?: DataTableSorting[]
  onSortingChange?: (sorting: DataTableSorting[]) => void
  manualSorting?: boolean
  columnFilters?: DataTableColumnFilter[]
  onColumnFiltersChange?: (filters: DataTableColumnFilter[]) => void
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  manualFiltering?: boolean
  pagination?: DataTablePagination
  onPaginationChange?: (pagination: Pick<DataTablePagination, 'pageIndex' | 'pageSize'>) => void
  /** Shows the built-in column visibility and ordering menu in the table toolbar. */
  showColumnSettings?: boolean
  enableColumnReordering?: boolean
  enableColumnResizing?: boolean
  enableMultiSort?: boolean
  onRowClick?: (row: T) => void
}

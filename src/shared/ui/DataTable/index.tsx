import { lazy, Suspense } from 'react'
import type { DataTableProps } from './types'

const LazyDataTable = lazy(() =>
  import('./DataTable').then(({ DataTable }) => ({ default: DataTable })),
) as (typeof import('./DataTable'))['DataTable']

export function DataTable<T extends object>(props: DataTableProps<T>) {
  return (
    <Suspense fallback={<div className="h-32 rounded-xl bg-bg-surface-muted" aria-busy="true" />}>
      <LazyDataTable {...props} />
    </Suspense>
  )
}
export type {
  DataTableAlignment,
  DataTableColumn,
  DataTableColumnFilterOption,
  DataTableColumnFilter,
  DataTableColumnWidth,
  DataTablePagination,
  DataTableProps,
  DataTableSortDirection,
  DataTableSorting,
  DataTableSortType,
} from './types'

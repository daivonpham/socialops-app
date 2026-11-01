export type PaginationProps = {
  current: number
  total: number
  pageSize: number
  pageSizeOptions?: number[]
  onChange: (page: number, pageSize: number) => void
  /** Hides the "1–10 / 50" range and the jump-to-page box, keeping page numbers and size. */
  compact?: boolean
  className?: string
}

export { Pagination } from '@/shared/components/ant/Pagination'

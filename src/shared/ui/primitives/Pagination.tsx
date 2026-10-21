export type PaginationProps = {
  current: number
  total: number
  pageSize: number
  pageSizeOptions?: number[]
  onChange: (page: number, pageSize: number) => void
  className?: string
}

export { Pagination } from '@/shared/components/ant/Pagination'

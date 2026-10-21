import { Pagination as AntPagination } from 'antd'
import type { PaginationProps } from '@/shared/ui/primitives/Pagination'

export function Pagination(props: PaginationProps) {
  return (
    <AntPagination
      current={props.current}
      total={props.total}
      pageSize={props.pageSize}
      pageSizeOptions={props.pageSizeOptions}
      showSizeChanger
      showQuickJumper
      showTotal={(total, range) => `${range[0]}–${range[1]} / ${total}`}
      onChange={props.onChange}
      className={props.className}
    />
  )
}

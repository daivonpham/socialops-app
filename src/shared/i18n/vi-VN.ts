import type { TranslationShape } from './types'
import type { commonEnUS } from './en-US'

export const commonViVN = {
  dropdown: {
    noMatches: 'Không có kết quả.',
  },
  filters: {
    trigger: 'Bộ lọc',
    reset: 'Đặt lại',
    apply: 'Áp dụng',
  },
  dataTable: {
    selectAllRows: 'Chọn tất cả hàng trên trang này',
    selectRow: 'Chọn hàng',
    selectionColumn: 'Chọn hàng dữ liệu',
    sortColumn: 'Sắp xếp theo {{column}}',
    sortAscending: 'Sắp xếp tăng dần',
    sortDescending: 'Sắp xếp giảm dần',
    clearSorting: 'Bỏ sắp xếp',
    reorderColumn: 'Đổi vị trí cột {{column}}',
    reorderHint: 'Kéo để đổi vị trí.',
    resizeColumn: 'Đổi độ rộng cột {{column}}',
    columnSettings: 'Cấu hình cột',
    resetColumns: 'Đặt lại cột',
    columnSettingsDescription: 'Ẩn, hiện và kéo thả cột theo thứ tự bạn muốn.',
    toggleColumn: 'Ẩn hoặc hiện cột {{column}}',
    noRows: 'Không có dữ liệu để hiển thị.',
    pageSummary: 'Trang {{page}} / {{pageCount}} · {{rowCount}} hàng',
    rowsPerPage: 'Số hàng mỗi trang',
    rowsCount: '{{count}} hàng',
    previousPage: 'Trước',
    nextPage: 'Sau',
  },
  locales: {
    enUS: 'English (US)',
    viVN: 'Tiếng Việt',
  },
} as const satisfies TranslationShape<typeof commonEnUS>

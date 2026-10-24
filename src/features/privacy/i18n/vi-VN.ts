import type { TranslationShape } from '@/shared/i18n'
import type { privacyEnUS } from './en-US'

export const privacyViVN = {
  dataDeletion: {
    title: 'Xóa dữ liệu Facebook',
    completedTitle: 'Dữ liệu Facebook của bạn đã được xóa',
    completedDescription:
      'SocialOps đã xóa kết nối Facebook, các mã truy cập và số liệu Trang đã đồng bộ qua kết nối đó. Các Trang dùng kết nối này đã được ngắt kết nối.',
    code: 'Mã xác nhận',
    completedAt: 'Hoàn tất lúc',
    notFoundTitle: 'Không tìm thấy yêu cầu',
    notFoundDescription: 'Hãy kiểm tra lại liên kết từ Facebook. Mã xác nhận có thể bị thiếu.',
    error: 'Không tải được trạng thái. Vui lòng thử lại.',
  },
} as const satisfies TranslationShape<typeof privacyEnUS>

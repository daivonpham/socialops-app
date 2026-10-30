import type { TranslationShape } from '@/shared/i18n'
import type { googleEnUS } from './en-US'

export const googleViVN = {
  callback: {
    completing: 'Đang kết nối tài khoản Google…',
    connected: 'Đã kết nối tài khoản Google. Bạn có thể đóng cửa sổ này.',
    failed: 'Không kết nối được tài khoản Google.',
    back: 'Về trang báo cáo',
  },
  integration: {
    title: 'Tài khoản Google',
    description:
      'Dùng để xuất báo cáo ra Google Trang tính. File được tạo trong Drive của tài khoản này.',
    notConnected: 'Chưa kết nối tài khoản Google nào.',
    connectedAs: 'Đã kết nối: {{email}}',
    reconnectNeeded: 'Quyền Google đã bị thu hồi hoặc hết hạn. Hãy kết nối lại để tiếp tục xuất.',
    connect: 'Kết nối Google',
    reconnect: 'Kết nối lại',
    disconnect: 'Ngắt kết nối',
    disconnectTitle: 'Ngắt kết nối Google?',
    disconnectDescription:
      'SocialOps sẽ không tạo Google Trang tính cho bạn nữa. Các file đã xuất vẫn nằm trong Drive của bạn.',
    disconnected: 'Đã ngắt kết nối tài khoản Google.',
    connectedToast: 'Đã kết nối tài khoản Google.',
    error: 'Có lỗi khi làm việc với Google. Hãy thử lại.',
    loadError: 'Không tải được kết nối Google.',
  },
  errors: {
    GOOGLE_AUTH_FAILED: 'Không kết nối được tài khoản Google.',
    GOOGLE_PERMISSION_MISSING:
      'SocialOps cần quyền với các file do chính nó tạo trong Google Drive. Hãy kết nối lại và giữ ô quyền đó được chọn.',
  },
} as const satisfies TranslationShape<typeof googleEnUS>

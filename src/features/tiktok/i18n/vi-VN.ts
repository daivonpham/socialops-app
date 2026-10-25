import type { TranslationShape } from '@/shared/i18n'
import type { tiktokEnUS } from './en-US'

export const tiktokViVN = {
  title: 'TikTok',
  noBrand: {
    title: 'Chưa có thương hiệu được chọn',
    description: 'Hãy tạo hoặc chọn một thương hiệu để xem tài khoản TikTok.',
  },
  description: 'Quản lý tài khoản TikTok kết nối với thương hiệu này.',
  connect: 'Kết nối TikTok',
  connecting: 'Đang kết nối…',
  disconnect: 'Ngắt kết nối',
  disconnectTitle: 'Ngắt kết nối TikTok?',
  disconnectDescription: 'Tài khoản này sẽ không còn khả dụng trong thương hiệu này.',
  cancel: 'Hủy',
  connected: 'Đã kết nối',
  disconnected: 'Thương hiệu này chưa kết nối tài khoản TikTok.',
  unavailable:
    'Chức năng đăng TikTok chưa khả dụng. Bạn có thể kết nối tài khoản, nhưng hiện chưa thể tạo hoặc lên lịch bài TikTok.',
  retry: 'Thử lại',
  loadError: 'Không tải được kết nối TikTok.',
  startError: 'Không thể bắt đầu kết nối TikTok.',
  oauthFailed: 'Kết nối TikTok thất bại.',
  connectSuccess: 'Đã kết nối tài khoản TikTok.',
  disconnectSuccess: 'Đã ngắt kết nối tài khoản TikTok.',
  disconnectError: 'Không thể ngắt kết nối TikTok.',
  completing: 'Đang hoàn tất kết nối TikTok…',
  back: 'Quay lại TikTok',
} satisfies TranslationShape<typeof tiktokEnUS>

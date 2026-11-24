import type { TranslationShape } from '@/shared/i18n'
import type { notificationsEnUS } from './en-US'

export const notificationsViVN = {
  title: 'Thông báo',
  trigger: 'Thông báo',
  triggerWithCount: 'Thông báo ({{count}} chưa đọc)',
  newCount: '{{count}} mới',
  markAllRead: 'Đọc tất cả',
  tabs: { label: 'Hiển thị', all: 'Tất cả', action: 'Cần xử lý' },
  groups: { today: 'Hôm nay', yesterday: 'Hôm qua', earlier: 'Trước đó' },
  empty: 'Bạn đã xem hết thông báo.',
  emptyAction: 'Không có việc nào cần bạn xử lý.',
  loadError: 'Không tải được thông báo.',
  retry: 'Thử lại',
  loadMore: 'Xem cũ hơn',
  unread: 'Chưa đọc',
  actions: {
    review: 'Duyệt bài',
    openPost: 'Mở bài',
    reconnect: 'Kết nối lại',
    reconnected: 'Đã kết nối lại.',
    reconnectError: 'Không kết nối lại được. Hãy thử lại ở màn quản lý tài khoản.',
  },
  roles: {
    owner: 'Chủ sở hữu',
    full_access: 'Toàn bộ quyền',
    admin: 'Quản trị viên',
    editor: 'Biên tập viên',
    viewer: 'Người xem',
  },
  types: {
    approval: {
      requested: { title: 'Bài chờ duyệt', body: '{{actor}}: “{{caption}}”' },
      requested_untitled: {
        title: 'Bài chờ duyệt',
        body: '{{actor}} gửi một bài không có caption.',
      },
      approved: { title: 'Bài đã được duyệt', body: '{{actor}} đã duyệt “{{caption}}”.' },
      approved_untitled: {
        title: 'Bài đã được duyệt',
        body: '{{actor}} đã duyệt bài không có caption của bạn.',
      },
      rejected: { title: 'Bài bị từ chối', body: '{{actor}} đã từ chối “{{caption}}”.' },
      rejected_untitled: {
        title: 'Bài bị từ chối',
        body: '{{actor}} đã từ chối bài không có caption của bạn.',
      },
    },
    publish: {
      failed: { title: 'Bài đăng lỗi', body: '{{account}}: “{{caption}}”' },
      failed_untitled: { title: 'Bài đăng lỗi', body: 'Chưa đăng được lên {{account}}.' },
      unknown: { title: 'Chưa rõ bài đã lên chưa', body: '{{account}}: “{{caption}}”' },
      unknown_untitled: {
        title: 'Chưa rõ bài đã lên chưa',
        body: 'Hãy kiểm tra bài trên {{account}}.',
      },
    },
    channel: {
      expiring: { title: 'Kết nối {{network}} sắp hết hạn', body: '{{channels}}' },
      expiring_more: {
        title: 'Kết nối {{network}} sắp hết hạn',
        body: '{{channels}} và {{count}} kênh khác',
      },
      reconnect: { title: '{{network}} cần kết nối lại', body: '{{channels}}' },
      reconnect_more: {
        title: '{{network}} cần kết nối lại',
        body: '{{channels}} và {{count}} kênh khác',
      },
      permission: {
        title: '{{network}} thiếu quyền',
        body: '{{channels}}: hãy kết nối lại và cấp đủ quyền.',
      },
      permission_more: {
        title: '{{network}} thiếu quyền',
        body: '{{channels}} và {{count}} kênh khác: hãy kết nối lại và cấp đủ quyền.',
      },
      removed: {
        title: 'Đã bị gỡ trên {{network}}',
        body: '{{channels}} đã gỡ SocialOps nên bị ngắt kết nối.',
      },
      removed_more: {
        title: 'Đã bị gỡ trên {{network}}',
        body: '{{channels}} và {{count}} kênh khác đã gỡ SocialOps nên bị ngắt kết nối.',
      },
    },
    member: {
      invited: { title: 'Lời mời vào Workspace', body: '{{actor}} mời bạn vào {{workspace}}.' },
      joined: { title: 'Thành viên mới', body: '{{actor}} đã tham gia {{workspace}}.' },
      role_changed: {
        title: 'Vai trò đã thay đổi',
        body: '{{actor}} đổi vai trò của bạn thành {{role}}.',
      },
    },
    ai: {
      succeeded: { title: 'AI đã viết xong bài', body: 'Bài gợi ý cho {{brand}} đã sẵn sàng.' },
      replied: { title: 'AI đã trả lời', body: 'Trong cuộc trò chuyện của {{brand}}.' },
      failed: { title: 'AI không tạo được bài', body: 'Mở cuộc trò chuyện để thử lại.' },
    },
    credits: {
      low: { title: 'Sắp hết Credits', body: 'Đã dùng {{used}}/{{limit}} Credits tháng này.' },
      out: {
        title: 'Đã hết Credits',
        body: 'Đã dùng hết {{limit}} Credits tháng này; yêu cầu AI mới phải chờ tháng sau.',
      },
    },
  },
} as const satisfies TranslationShape<typeof notificationsEnUS>

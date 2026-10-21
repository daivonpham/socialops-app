import type { TranslationShape } from '@/shared/i18n'
import type { appEnUS } from './en-US'

export const appViVN = {
  document: {
    title: 'SocialOps',
  },
  navigation: {
    allPlatforms: 'Tất cả nền tảng',
    overview: 'Tổng quan',
    planning: 'Lập kế hoạch',
    reports: 'Báo cáo',
    members: 'Thành viên',
    settings: 'Cài đặt',
  },
  sections: {
    summary: 'Tóm tắt',
    platforms: 'Nền tảng',
  },
  placeholder: {
    comingSoon: 'Sắp ra mắt',
    description: 'Đây là màn hình tạm thời — tính năng {{title}} sẽ được phát triển sau.',
  },
  accessDenied: {
    title: 'Bạn không có quyền truy cập trang này',
    description:
      'Vai trò của bạn trong thương hiệu hiện tại không bao gồm khu vực này. Hãy chuyển sang thương hiệu khác hoặc liên hệ quản trị viên workspace.',
    goToAllPlatforms: 'Đi đến Tất cả nền tảng',
  },
  sidebar: {
    collapse: 'Thu gọn thanh bên',
    expand: 'Mở rộng thanh bên',
  },
  topbar: {
    openNavigation: 'Mở điều hướng',
    home: 'Trang chủ SocialOps',
    primaryNavigation: 'Điều hướng chính',
  },
  account: {
    menu: 'Menu tài khoản',
    profile: 'Trang cá nhân',
    changePassword: 'Đổi mật khẩu',
    languageOption: 'Ngôn ngữ: {{language}}',
    signOut: 'Đăng xuất',
  },
  profile: {
    title: 'Trang cá nhân',
    subtitle: 'Quản lý thông tin cá nhân và bảo mật tài khoản.',
    tabsLabel: 'Các mục trong trang cá nhân',
    detailsTab: 'Thông tin cá nhân',
    passwordTab: 'Mật khẩu',
    detailsTitle: 'Thông tin cá nhân',
    detailsDescription: 'Thông tin được liên kết với tài khoản SocialOps của bạn.',
    name: 'Họ và tên',
    email: 'Địa chỉ email',
    language: 'Ngôn ngữ',
    editAvatar: 'Đổi ảnh đại diện',
    avatarPreview: 'Xem trước ảnh đại diện',
    avatarHint: 'JPEG, PNG hoặc WebP. Tối đa 5 MB.',
    avatarInvalid: 'Chỉ hỗ trợ JPEG, PNG hoặc WebP tối đa 5 MB.',
    avatarUploadError: 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.',
    avatarUploadSuccess: 'Ảnh đại diện đã được cập nhật.',
    saveError: 'Không thể lưu thông tin. Vui lòng thử lại.',
    saveSuccess: 'Thông tin cá nhân đã được cập nhật.',
    nameRequired: 'Nhập họ và tên',
    nameMin: 'Họ và tên phải có ít nhất 2 ký tự',
    nameMax: 'Họ và tên không được quá 120 ký tự',
    cancel: 'Hủy',
    save: 'Lưu thay đổi',
  },
  permissions: {
    manageChannels: 'Quản lý kênh',
    publishContent: 'Xuất bản nội dung',
    approveContent: 'Duyệt nội dung',
    manageWorkspace: 'Quản lý không gian làm việc',
    viewAnalytics: 'Xem phân tích',
    viewReports: 'Xem báo cáo',
    viewMembers: 'Xem thành viên',
    viewSettings: 'Xem cài đặt',
  },
} as const satisfies TranslationShape<typeof appEnUS>

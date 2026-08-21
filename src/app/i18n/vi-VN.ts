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
    profile: 'Hồ sơ',
    languageOption: 'Ngôn ngữ: {{language}}',
    signOut: 'Đăng xuất',
  },
  permissions: {
    viewReports: 'Xem báo cáo',
    viewMembers: 'Xem thành viên',
    viewSettings: 'Xem cài đặt',
  },
} as const satisfies TranslationShape<typeof appEnUS>

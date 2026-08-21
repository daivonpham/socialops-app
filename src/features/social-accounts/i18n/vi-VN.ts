import type { TranslationShape } from '@/shared/i18n'
import type { socialAccountsEnUS } from './en-US'

export const socialAccountsViVN = {
  platforms: {
    facebook: 'Facebook',
    tiktok: 'TikTok',
  },
  navigation: {
    loadError: 'Không thể tải các nền tảng đã kết nối của thương hiệu này.',
    retry: 'Thử lại',
    connectedAccounts_one: '{{formattedCount}} tài khoản {{platform}} đã kết nối',
    connectedAccounts_other: '{{formattedCount}} tài khoản {{platform}} đã kết nối',
  },
} as const satisfies TranslationShape<typeof socialAccountsEnUS>

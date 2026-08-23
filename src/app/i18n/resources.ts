import { BRANDS_I18N } from '@/features/brands'
import { SOCIAL_ACCOUNTS_I18N } from '@/features/social-accounts'
import { WORKSPACES_I18N } from '@/features/workspaces'
import { FACEBOOK_I18N } from '@/features/facebook'
import { commonEnUS, commonViVN } from '@/shared/i18n'
import { appEnUS } from './en-US'
import { appViVN } from './vi-VN'

export const defaultResources = {
  common: commonEnUS,
  app: appEnUS,
  brands: BRANDS_I18N['en-US'],
  workspaces: WORKSPACES_I18N['en-US'],
  socialAccounts: SOCIAL_ACCOUNTS_I18N['en-US'],
  facebook: FACEBOOK_I18N['en-US'],
} as const

export const resources = {
  'en-US': defaultResources,
  'vi-VN': {
    common: commonViVN,
    app: appViVN,
    brands: BRANDS_I18N['vi-VN'],
    workspaces: WORKSPACES_I18N['vi-VN'],
    socialAccounts: SOCIAL_ACCOUNTS_I18N['vi-VN'],
    facebook: FACEBOOK_I18N['vi-VN'],
  },
} as const

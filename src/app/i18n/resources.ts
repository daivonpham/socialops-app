import { BRANDS_I18N } from '@/features/brands'
import { AUTH_I18N } from '@/features/auth'
import { SOCIAL_ACCOUNTS_I18N } from '@/features/social-accounts'
import { WORKSPACES_I18N } from '@/features/workspaces'
import { FACEBOOK_I18N } from '@/features/facebook'
import { PLANNING_I18N } from '@/features/planning'
import { TIKTOK_I18N } from '@/features/tiktok'
import { OVERVIEW_I18N } from '@/features/overview'
import { PRIVACY_I18N } from '@/features/privacy'
import { REPORTS_I18N } from '@/features/reports'
import { GOOGLE_I18N } from '@/features/google'
import { commonEnUS, commonViVN } from '@/shared/i18n'
import { appEnUS } from './en-US'
import { appViVN } from './vi-VN'

export const defaultResources = {
  common: commonEnUS,
  app: appEnUS,
  auth: AUTH_I18N['en-US'],
  brands: BRANDS_I18N['en-US'],
  workspaces: WORKSPACES_I18N['en-US'],
  socialAccounts: SOCIAL_ACCOUNTS_I18N['en-US'],
  facebook: FACEBOOK_I18N['en-US'],
  planning: PLANNING_I18N['en-US'],
  tiktok: TIKTOK_I18N['en-US'],
  overview: OVERVIEW_I18N['en-US'],
  privacy: PRIVACY_I18N['en-US'],
  reports: REPORTS_I18N['en-US'],
  google: GOOGLE_I18N['en-US'],
} as const

export const resources = {
  'en-US': defaultResources,
  'vi-VN': {
    common: commonViVN,
    app: appViVN,
    auth: AUTH_I18N['vi-VN'],
    brands: BRANDS_I18N['vi-VN'],
    workspaces: WORKSPACES_I18N['vi-VN'],
    socialAccounts: SOCIAL_ACCOUNTS_I18N['vi-VN'],
    facebook: FACEBOOK_I18N['vi-VN'],
    planning: PLANNING_I18N['vi-VN'],
    tiktok: TIKTOK_I18N['vi-VN'],
    overview: OVERVIEW_I18N['vi-VN'],
    privacy: PRIVACY_I18N['vi-VN'],
    reports: REPORTS_I18N['vi-VN'],
    google: GOOGLE_I18N['vi-VN'],
  },
} as const

import { AUTH_ROUTES } from '@/features/auth/config/auth.routes'

/** Single source of route paths — never hard-code path strings elsewhere. */
export const ROUTES = {
  ROOT: '/',
  LOGIN: AUTH_ROUTES.LOGIN,
  REGISTER: AUTH_ROUTES.REGISTER,
  FORGOT_PASSWORD: AUTH_ROUTES.FORGOT_PASSWORD,
  RESET_PASSWORD: AUTH_ROUTES.RESET_PASSWORD,
  VERIFY_EMAIL: AUTH_ROUTES.VERIFY_EMAIL,
  GOOGLE_CALLBACK: AUTH_ROUTES.GOOGLE_CALLBACK,
  INVITATION: AUTH_ROUTES.INVITATION,
  FACEBOOK_CALLBACK: '/auth/facebook/callback',
  /** Meta links users here after a data deletion request; must stay public and stable. */
  FACEBOOK_DATA_DELETION: '/facebook/data-deletion',
  /** Printed into report PDFs by headless Chromium; public, authorized by a one-time token. */
  REPORT_PRINT: '/reports/print',
  TIKTOK_CALLBACK: '/auth/tiktok/callback',
  CHANGE_PASSWORD: AUTH_ROUTES.CHANGE_PASSWORD,
  PROFILE: '/profile',
  ALL_PLATFORMS: '/all-platforms',
  PLATFORM: '/platforms/:platform',
  PLATFORM_OVERVIEW: '/platforms/:platform/overview',
  PLATFORM_PLANNING: '/platforms/:platform/planning',
  PLATFORM_PLANNING_CREATE: '/platforms/:platform/planning/create',
  PLATFORM_PLANNING_EDIT: '/platforms/:platform/planning/:contentId/edit',
  FACEBOOK_OVERVIEW: '/platforms/facebook/overview',
  TIKTOK_OVERVIEW: '/platforms/tiktok/overview',
  REPORTS: '/reports',
  REPORTS_NEW: '/reports/new',
  REPORTS_DETAIL: '/reports/:reportId',
  MEMBERS: '/members',
  SETTINGS: '/settings',
} as const

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
  CHANGE_PASSWORD: AUTH_ROUTES.CHANGE_PASSWORD,
  PROFILE: '/profile',
  SELECT_BRAND: AUTH_ROUTES.POST_AUTH,
  ALL_PLATFORMS: '/all-platforms',
  PLATFORM: '/platforms/:platform',
  PLATFORM_OVERVIEW: '/platforms/:platform/overview',
  PLATFORM_PLANNING: '/platforms/:platform/planning',
  PLATFORM_PLANNING_CREATE: '/platforms/:platform/planning/create',
  PLATFORM_PLANNING_EDIT: '/platforms/:platform/planning/:contentId/edit',
  FACEBOOK_OVERVIEW: '/platforms/facebook/overview',
  REPORTS: '/reports',
  MEMBERS: '/members',
  SETTINGS: '/settings',
} as const

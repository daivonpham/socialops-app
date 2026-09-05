/** Single source of route paths — never hard-code path strings elsewhere. */
export const ROUTES = {
  ROOT: '/',
  SELECT_BRAND: '/select-brand',
  ALL_PLATFORMS: '/all-platforms',
  PLATFORM: '/platforms/:platform',
  PLATFORM_OVERVIEW: '/platforms/:platform/overview',
  PLATFORM_PLANNING: '/platforms/:platform/planning',
  FACEBOOK_OVERVIEW: '/platforms/facebook/overview',
  REPORTS: '/reports',
  MEMBERS: '/members',
  SETTINGS: '/settings',
} as const

/** Single source of route paths — never hard-code path strings elsewhere. */
export const ROUTES = {
  ROOT: '/',
  SELECT_BRAND: '/select-brand',
  ALL_PLATFORMS: '/all-platforms',
  FACEBOOK: '/platforms/facebook',
  PLATFORM: '/platforms/:platform',
  OVERVIEW: '/overview',
  PLANNING: '/planning',
  REPORTS: '/reports',
  MEMBERS: '/members',
  SETTINGS: '/settings',
} as const

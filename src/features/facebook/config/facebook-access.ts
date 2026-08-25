import { PERMISSIONS } from '@/shared/permissions'

export const FACEBOOK_ACCESS = {
  manageConnection: [PERMISSIONS.CHANNELS_MANAGE.key],
  analytics: [PERMISSIONS.ANALYTICS_VIEW.key],
} as const

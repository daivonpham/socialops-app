import { PERMISSIONS } from '@/shared/permissions'

export const FACEBOOK_ACCESS = {
  manageConnection: [PERMISSIONS.CHANNELS_MANAGE.key],
  publish: [PERMISSIONS.PUBLISHING_PUBLISH.key],
  analytics: [PERMISSIONS.ANALYTICS_VIEW.key],
} as const

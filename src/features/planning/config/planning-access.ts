import { PERMISSIONS } from '@/shared/permissions'

export const PLANNING_ACCESS = {
  publish: [PERMISSIONS.PUBLISHING_PUBLISH.key],
  publishDirect: [PERMISSIONS.PUBLISHING_PUBLISH_DIRECT.key],
  approve: [PERMISSIONS.PUBLISHING_APPROVE.key],
} as const

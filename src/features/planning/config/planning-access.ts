import { PERMISSIONS } from '@/shared/permissions'

export const PLANNING_ACCESS = {
  publish: [PERMISSIONS.PUBLISHING_PUBLISH.key],
  approve: [PERMISSIONS.PUBLISHING_APPROVE.key],
} as const

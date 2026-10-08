import type { StatusTone } from '@/shared/ui'
import type { PlanningApprovalStatus, PlanningStatus } from '../api'

export type PlanningStatusMetadata = {
  tone: StatusTone
}

export const PLANNING_STATUS_META: Record<PlanningStatus, PlanningStatusMetadata> = {
  draft: { tone: 'neutral' },
  scheduled: { tone: 'info' },
  queued: { tone: 'info' },
  publishing: { tone: 'info' },
  processing: { tone: 'info' },
  verifying: { tone: 'info' },
  published: { tone: 'success' },
  editing: { tone: 'info' },
  deleting: { tone: 'warning' },
  deleted: { tone: 'neutral' },
  edit_unknown: { tone: 'warning' },
  delete_unknown: { tone: 'warning' },
  failed: { tone: 'error' },
  partial: { tone: 'warning' },
  unknown: { tone: 'warning' },
  cancelled: { tone: 'neutral' },
  retry_wait: { tone: 'warning' },
}

export const PLANNING_STATUS_TONE: Record<PlanningStatus, StatusTone> = Object.fromEntries(
  Object.entries(PLANNING_STATUS_META).map(([status, metadata]) => [status, metadata.tone]),
) as Record<PlanningStatus, StatusTone>

export const PLANNING_APPROVAL_STATUS_TONE: Record<PlanningApprovalStatus, StatusTone> = {
  none: 'neutral',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

import type { StatusTone } from '@/shared/ui'
import type { PlanningApprovalStatus, PlanningStatus } from '../api'

export type PlanningStatusMetadata = {
  tone: StatusTone
}

export const PLANNING_STATUS_META: Record<PlanningStatus, PlanningStatusMetadata> = {
  draft: { tone: 'neutral' },
  scheduled: { tone: 'info' },
  publishing: { tone: 'info' },
  published: { tone: 'success' },
  failed: { tone: 'error' },
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

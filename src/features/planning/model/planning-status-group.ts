import type { StatusTone } from '@/shared/ui'
import type { PlanningContent } from '../api'
import type { PlanningStatusGroup } from '../config/planning.filters'
import { pendingApprovalIntent } from './approval'

export type PlanningSummaryStatus = PlanningStatusGroup | 'deleted'

export function planningSummaryStatusTone(status: PlanningSummaryStatus): StatusTone {
  if (status === 'published') return 'success'
  if (status === 'needs_action') return 'error'
  if (status === 'pending_approval') return 'warning'
  if (status === 'scheduled' || status === 'in_progress') return 'info'
  return 'neutral'
}

export function planningStatusGroup(content: PlanningContent): PlanningSummaryStatus {
  const statuses = content.publications?.map((item) => item.status) ?? []
  if (
    statuses.some((status) =>
      ['failed', 'unknown', 'edit_unknown', 'delete_unknown'].includes(status),
    ) ||
    ['failed', 'unknown', 'edit_unknown', 'delete_unknown'].includes(content.status)
  )
    return 'needs_action'
  if (
    statuses.some((status) =>
      [
        'queued',
        'publishing',
        'processing',
        'verifying',
        'retry_wait',
        'edit_queued',
        'editing',
        'deleting',
      ].includes(status),
    ) ||
    [
      'queued',
      'publishing',
      'processing',
      'verifying',
      'retry_wait',
      'edit_queued',
      'editing',
      'deleting',
    ].includes(content.status)
  )
    return 'in_progress'
  if (statuses.length > 0 && statuses.every((status) => ['cancelled', 'deleted'].includes(status)))
    return 'deleted'
  if (
    statuses.some((status) => status === 'published') ||
    ['published', 'partial'].includes(content.status)
  )
    return 'published'
  if (pendingApprovalIntent(content)) return 'pending_approval'
  if (content.status === 'scheduled' || statuses.some((status) => status === 'scheduled'))
    return 'scheduled'
  if (['cancelled', 'deleted'].includes(content.status)) return 'deleted'
  return 'draft'
}

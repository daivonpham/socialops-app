import type { PlanningContent } from '../api'
import type { PlanningStatusGroup } from '../config/planning.filters'

export function planningStatusGroup(content: PlanningContent): PlanningStatusGroup {
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
      'editing',
      'deleting',
    ].includes(content.status)
  )
    return 'in_progress'
  if (
    statuses.some((status) => status === 'published') ||
    ['published', 'partial'].includes(content.status)
  )
    return 'published'
  if (content.status === 'scheduled' || statuses.some((status) => status === 'scheduled'))
    return 'scheduled'
  return 'draft'
}

import type { PlanningStatus } from '../api'

export type PlanningDragPolicy = {
  draggable: boolean
  requiresConfirmation: boolean
}

const NON_DRAGGABLE: PlanningDragPolicy = {
  draggable: false,
  requiresConfirmation: false,
}

/**
 * Drafts only change their planned date. Moving a scheduled post changes when it goes out, a
 * publishing decision reserved for members with `publishing.publish_direct`.
 */
export function getPlanningDragPolicy(
  status: PlanningStatus,
  canPublishDirect = true,
): PlanningDragPolicy {
  switch (status) {
    case 'draft':
      return { draggable: true, requiresConfirmation: false }
    case 'scheduled':
      return canPublishDirect ? { draggable: true, requiresConfirmation: true } : NON_DRAGGABLE
    default:
      return NON_DRAGGABLE
  }
}

export function isPlanningContentDraggable(status: PlanningStatus) {
  return getPlanningDragPolicy(status).draggable
}

export function requiresPlanningDragConfirmation(status: PlanningStatus) {
  return getPlanningDragPolicy(status).requiresConfirmation
}

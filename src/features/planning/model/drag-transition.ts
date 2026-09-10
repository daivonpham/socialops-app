import type { PlanningStatus } from '../api'

export type PlanningDragPolicy = {
  draggable: boolean
  requiresConfirmation: boolean
}

const NON_DRAGGABLE: PlanningDragPolicy = {
  draggable: false,
  requiresConfirmation: false,
}

export function getPlanningDragPolicy(status: PlanningStatus): PlanningDragPolicy {
  switch (status) {
    case 'draft':
      return { draggable: true, requiresConfirmation: false }
    case 'scheduled':
      return { draggable: true, requiresConfirmation: true }
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

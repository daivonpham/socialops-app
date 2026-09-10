import type { PlanningApprovalStatus, PlanningStatus } from '../api'

export type PlanningView = 'calendar' | 'list'
export type PlanningCalendarView = 'month' | 'week'

const PLANNING_PREFERRED_VIEW_STORAGE_KEY = 'socialops.planning.preferred-view:v1'

export type PlanningUrlFilters = {
  view: PlanningView
  calendarView: PlanningCalendarView
  date: string

  accountId: 'all' | string
  status: 'all' | PlanningStatus
  approvalStatus: 'all' | PlanningApprovalStatus
}

export const PLANNING_FILTER_DEFAULTS: PlanningUrlFilters = {
  view: 'calendar',
  calendarView: 'month',
  date: '2026-09-08',

  accountId: 'all',
  status: 'all',
  approvalStatus: 'all',
}

export function readPreferredPlanningView(): PlanningView {
  if (typeof window === 'undefined') return PLANNING_FILTER_DEFAULTS.view
  try {
    const value = window.localStorage.getItem(PLANNING_PREFERRED_VIEW_STORAGE_KEY)
    return value === 'calendar' || value === 'list' ? value : PLANNING_FILTER_DEFAULTS.view
  } catch {
    return PLANNING_FILTER_DEFAULTS.view
  }
}

export function persistPreferredPlanningView(view: PlanningView): void {
  try {
    window.localStorage.setItem(PLANNING_PREFERRED_VIEW_STORAGE_KEY, view)
  } catch {
    // The current selection remains active when storage is unavailable.
  }
}

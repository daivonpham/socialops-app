import type { PlanningApprovalStatus, PlanningPostType } from '../api'

export type PlanningView = 'calendar' | 'list'
export type PlanningCalendarView = 'month' | 'week'

export type PlanningStatusGroup =
  'draft' | 'pending_approval' | 'scheduled' | 'in_progress' | 'published' | 'needs_action'

export const PLANNING_FILTER_STATUS_GROUPS: PlanningStatusGroup[] = [
  'draft',
  'pending_approval',
  'scheduled',
  'in_progress',
  'published',
  'needs_action',
]

export const PLANNING_FILTER_APPROVAL_STATUSES: PlanningApprovalStatus[] = [
  'none',
  'pending',
  'approved',
  'rejected',
]

export const PLANNING_FILTER_POST_TYPES: PlanningPostType[] = [
  'facebook_feed',
  'facebook_story',
  'facebook_reel',
  'tiktok_video',
  'tiktok_photo',
]

const PLANNING_PREFERRED_VIEW_STORAGE_KEY = 'socialops.planning.preferred-view:v1'

export function getPlanningTodayDateKey(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export type PlanningUrlFilters = {
  view: PlanningView
  calendarView: PlanningCalendarView
  date: string

  accountId: 'all' | string
  type: 'all' | PlanningPostType
  statusGroup: 'all' | PlanningStatusGroup
  attention: 'all' | 'needs_action'
  approvalStatus: 'all' | PlanningApprovalStatus
}

export const PLANNING_FILTER_DEFAULTS: PlanningUrlFilters = {
  view: 'calendar',
  calendarView: 'month',
  date: getPlanningTodayDateKey(),

  accountId: 'all',
  type: 'all',
  statusGroup: 'all',
  attention: 'all',
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

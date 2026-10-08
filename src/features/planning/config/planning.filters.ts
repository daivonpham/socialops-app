import type { PlanningApprovalStatus, PlanningPostType } from '../api'

export type PlanningView = 'calendar' | 'list'
export type PlanningCalendarView = 'month' | 'week'

export type PlanningStatusGroup =
  'draft' | 'scheduled' | 'in_progress' | 'published' | 'needs_action'

export const PLANNING_FILTER_STATUS_GROUPS: PlanningStatusGroup[] = [
  'draft',
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
  date: '2026-09-08',

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

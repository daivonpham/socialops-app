export type PlanningPlatform = 'facebook' | 'tiktok'

export type PlanningStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'rejected'

export type PlanningMediaType = 'image' | 'video' | 'text'

export type PlanningTarget = {
  id: string
  name: string
  avatarUrl?: string
}

export type PlanningContent = {
  id: string
  caption: string
  title?: string
  thumbnailUrl?: string
  mediaType: PlanningMediaType
  platform: PlanningPlatform
  targets: PlanningTarget[]
  status: PlanningStatus
  scheduledAt?: string
  createdAt: string
  createdBy: string
}

export type PlanningQuery = {
  platform: 'all' | PlanningPlatform
  accountId: 'all' | string
  status: 'all' | PlanningStatus
  from?: string
  to?: string
}

export type PlanningContentsResponse = {
  items: PlanningContent[]
}

export type CreatePlanningContentInput = {
  brandId: string
  platform: PlanningPlatform
  targetIds: string[]
  caption: string
  scheduledAt?: string
  status: 'draft' | 'scheduled'
}

export type ReschedulePlanningContentInput = {
  brandId: string
  contentId: string
  scheduledAt: string
}

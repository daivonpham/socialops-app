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
export type PlanningPostType =
  'facebook_feed' | 'facebook_reel' | 'facebook_story' | 'tiktok_video' | 'tiktok_photo'
export type PlanningPublishIntent = 'draft' | 'approval' | 'publish_now' | 'schedule'

export type PlanningMedia = {
  id: string
  type: Exclude<PlanningMediaType, 'text'>
  url: string
  name: string
}

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
  publications?: PlanningPublication[]
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

export type PlanningPublication = {
  id: string
  socialAccountId: string
  target: PlanningTarget
  captionOverride?: string
  scheduledAt?: string
  status: PlanningStatus
  externalPostId?: string
  externalPostUrl?: string
  publishedAt?: string
  errorCode?: string
  errorMessage?: string
}

export type CreatePlanningContentInput = {
  brandId: string
  platform: PlanningPlatform
  type: PlanningPostType
  caption: string
  link?: string
  media: PlanningMedia[]
  publications: Array<{
    socialAccountId: string
    captionOverride?: string
    scheduledAt?: string
  }>
  intent: PlanningPublishIntent
  platformSettings: Record<string, boolean | string>
}

export type ReschedulePlanningContentInput = {
  brandId: string
  contentId: string
  scheduledAt: string
}

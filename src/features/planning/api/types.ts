export type PlanningPlatform = 'facebook' | 'tiktok'

export type PlanningStatus =
  | 'draft'
  | 'scheduled'
  | 'queued'
  | 'publishing'
  | 'processing'
  | 'verifying'
  | 'published'
  | 'editing'
  | 'deleting'
  | 'deleted'
  | 'edit_unknown'
  | 'delete_unknown'
  | 'failed'
  | 'partial'
  | 'unknown'
  | 'cancelled'
  | 'retry_wait'

export type PlanningApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected'

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

export type PlanningAccountDto = PlanningTarget & {
  platform: PlanningPlatform
}

export type PlanningAccountsResponse = {
  items: PlanningAccountDto[]
}

export type PlanningContent = {
  id: string
  version: number
  caption: string
  title?: string
  thumbnailUrl?: string
  mediaType: PlanningMediaType
  type?: PlanningPostType
  link?: string
  media?: PlanningMedia[]
  platformSettings?: Record<string, boolean | string>
  platform: PlanningPlatform
  targets: PlanningTarget[]
  publications?: PlanningPublication[]
  status: PlanningStatus
  approvalStatus: PlanningApprovalStatus
  scheduledAt?: string
  createdAt: string
  createdBy: string
}

import type { PlanningStatusGroup } from '../config/planning.filters'

export type PlanningQuery = {
  platform: 'all' | PlanningPlatform
  type: 'all' | PlanningPostType
  accountId: 'all' | string
  statusGroup: 'all' | PlanningStatusGroup
  attention: 'all' | 'needs_action'
  approvalStatus?: 'all' | PlanningApprovalStatus
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

export type PlanningRetryResult = {
  publicationId: string
  socialAccountId: string
  outcome: 'queued' | 'skipped'
  reason?: string
}

export type PlanningRetryBatchResponse = {
  content: PlanningContent
  results: PlanningRetryResult[]
}

export type CreatePlanningContentInput = {
  brandId: string
  idempotencyKey?: string
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

export type UpdatePlanningApprovalInput = {
  brandId: string
  contentId: string
  approvalStatus: PlanningApprovalStatus
}

export type UpdatePlanningContentInput = CreatePlanningContentInput & {
  contentId: string
  version: number
}

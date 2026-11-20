export type PlanningPlatform = 'facebook' | 'tiktok'

export type PlanningStatus =
  | 'draft'
  | 'scheduled'
  | 'queued'
  | 'publishing'
  | 'processing'
  | 'verifying'
  | 'published'
  | 'edit_queued'
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
/**
 * `approval_*` submits for approval and goes out (now or at the chosen time) once approved.
 * `publish_now`/`schedule` skip approval and need `publishing.publish_direct`.
 */
export type PlanningPublishIntent =
  'draft' | 'approval_publish_now' | 'approval_schedule' | 'publish_now' | 'schedule'

export type PlanningMedia = {
  id: string
  type: Exclude<PlanningMediaType, 'text'>
  url: string
  name: string
}

export type PlanningTarget = {
  id: string
  name: string
  /** The Page ID on Facebook, used to reconnect the Page. */
  providerAccountId?: string
  avatarUrl?: string
}

export type PlanningAccountDto = PlanningTarget & {
  platform: PlanningPlatform
}

export type PlanningAccountsResponse = {
  items: PlanningAccountDto[]
}

/** `per_target`: every Page has its own caption and `caption` mirrors the first Page. */
export type PlanningCaptionMode = 'shared' | 'per_target'

export type PlanningContent = {
  id: string
  version: number
  caption: string
  captionMode?: PlanningCaptionMode
  title?: string
  thumbnailUrl?: string
  /** Picture Facebook holds once the post is published. */
  pictureUrl?: string
  mediaType: PlanningMediaType
  type?: PlanningPostType
  link?: string
  media?: PlanningMedia[]
  /** A Reel's chosen cover; Facebook picks one when there is none. */
  thumbnail?: PlanningMedia
  /** Posted by the Page under the post once it is out. */
  firstComment?: string
  platformSettings?: Record<string, boolean | string>
  platform: PlanningPlatform
  targets: PlanningTarget[]
  publications?: PlanningPublication[]
  status: PlanningStatus
  approvalStatus: PlanningApprovalStatus
  /** How Content submitted for approval goes out once approved. */
  approvalIntent?: 'publish_now' | 'schedule'
  /** Who submitted the post for approval; only they may withdraw it. */
  approvalRequestedById?: string
  approvalRequestedBy?: string
  approvalRequestedAt?: string
  /** Who approved or rejected the current submission. */
  approvalReviewedBy?: string
  approvalReviewedAt?: string
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

/** A calendar window returns every post inside it; the list is paginated instead. */
export type PlanningContentsResponse = {
  items: PlanningContent[]
}

export type PlanningPublication = {
  id: string
  socialAccountId: string
  target: PlanningTarget
  captionOverride?: string
  pendingCaption?: string
  scheduledAt?: string
  status: PlanningStatus
  externalPostId?: string
  externalPostUrl?: string
  publishedAt?: string
  errorCode?: string
  /**
   * TikTok only: where TikTok is with the post (`started`, `processing`, `moderation`, `inbox`,
   * `published`, `published_without_id`).
   */
  providerPhase?: string
  errorMessage?: string
  /** This Page's own first comment when every Page has its own caption. */
  firstComment?: string
  /** How the first comment went on this Page; the post is out either way. */
  firstCommentStatus?: 'posting' | 'posted' | 'failed'
  /** An API error code, translated in the `errors` namespace. */
  firstCommentError?: string
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

export type PlanningDeleteBatchResponse = {
  content: PlanningContent
  results: Array<{
    publicationId: string
    socialAccountId: string
    outcome: 'deleted' | 'skipped' | 'failed'
    reason?: string
  }>
}

export type CreatePlanningContentInput = {
  brandId: string
  idempotencyKey?: string
  platform: PlanningPlatform
  type: PlanningPostType
  caption: string
  captionMode: PlanningCaptionMode
  link?: string
  media: PlanningMedia[]
  /** A Reel's cover, uploaded like other media; `null` clears it. */
  thumbnail?: PlanningMedia | null
  /** `null` posts no first comment. */
  firstComment?: string | null
  publications: Array<{
    socialAccountId: string
    captionOverride?: string
    scheduledAt?: string
    /** This Page's own first comment, sent in per-Page mode; empty posts none. */
    firstComment?: string
  }>
  intent: PlanningPublishIntent
  platformSettings: Record<string, boolean | string>
  /** The AI suggestion this post was filled from; it shows as used once saved. */
  aiGenerationId?: string
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
  /** When approving: publish now instead of the requested way. */
  publishNow?: boolean
  /** When approving: schedule every target at this time instead. */
  scheduledAt?: string
}

export type UpdatePlanningContentInput = CreatePlanningContentInput & {
  contentId: string
  version: number
}

export type PlanningSummary = {
  since: string
  until: string
  publishedInRange: number
  scheduledNext7Days: number
  nextScheduledAt: string | null
  needsAction: number
  inProgress: number
  drafts: number
  pendingApproval: number
}

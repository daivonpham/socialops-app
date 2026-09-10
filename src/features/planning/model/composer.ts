import type {
  CreatePlanningContentInput,
  PlanningContent,
  PlanningMedia,
  PlanningPlatform,
  PlanningPostType,
  PlanningPublishIntent,
  UpdatePlanningContentInput,
} from '../api'

export type PreviewViewport = 'mobile' | 'desktop'
export type ScheduleMode = 'same_time' | 'by_account'
export type ComposerMedia = PlanningMedia

export type PlanningComposerDraft = {
  platform: PlanningPlatform
  postType: PlanningPostType
  targetIds: string[]
  caption: string
  link: string
  media: ComposerMedia[]
  captionOverrides: Record<string, string>
  publishMode: 'publish_now' | 'schedule'
  scheduleMode: ScheduleMode
  scheduledAt: string
  accountSchedules: Record<string, string>
  platformSettings: Record<string, boolean | string>
}

export function createComposerDraft(platform: PlanningPlatform): PlanningComposerDraft {
  return {
    platform,
    postType: platform === 'facebook' ? 'facebook_feed' : 'tiktok_video',
    targetIds: [],
    caption: '',
    link: '',
    media: [],
    captionOverrides: {},
    publishMode: 'publish_now',
    scheduleMode: 'same_time',
    scheduledAt: '',
    accountSchedules: {},
    platformSettings:
      platform === 'facebook'
        ? { allowComments: true, shareToFeed: true }
        : {
            visibility: 'public',
            allowComments: true,
            allowDuet: true,
            allowStitch: true,
            commercialContent: false,
            aiGeneratedContent: false,
            coverFrame: '0',
          },
  }
}

export function createComposerDraftFromContent(content: PlanningContent): PlanningComposerDraft {
  const defaults = createComposerDraft(content.platform)
  const publications = content.publications ?? []
  const scheduledAt = content.scheduledAt ?? publications[0]?.scheduledAt ?? ''
  const publicationSchedules = publications.filter((publication) => publication.scheduledAt)
  const usesAccountSchedules =
    publicationSchedules.length > 1 &&
    new Set(publicationSchedules.map((publication) => publication.scheduledAt)).size > 1
  const fallbackMedia =
    content.thumbnailUrl && content.mediaType !== 'text'
      ? [
          {
            id: `${content.id}-media`,
            type: content.mediaType,
            url: content.thumbnailUrl,
            name: content.title ?? content.caption,
          },
        ]
      : []

  return {
    ...defaults,
    postType: content.type ?? inferPostType(content),
    targetIds:
      publications.length > 0
        ? publications.map((publication) => publication.socialAccountId)
        : content.targets.map((target) => target.id),
    caption: content.caption,
    link: content.link ?? '',
    media: content.media ?? fallbackMedia,
    captionOverrides: Object.fromEntries(
      publications.flatMap((publication) =>
        publication.captionOverride
          ? [[publication.socialAccountId, publication.captionOverride]]
          : [],
      ),
    ),
    publishMode: content.status === 'scheduled' ? 'schedule' : 'publish_now',
    scheduleMode: usesAccountSchedules ? 'by_account' : 'same_time',
    scheduledAt,
    accountSchedules: Object.fromEntries(
      publicationSchedules.map((publication) => [
        publication.socialAccountId,
        publication.scheduledAt!,
      ]),
    ),
    platformSettings: { ...defaults.platformSettings, ...content.platformSettings },
  }
}

export function getPlanningContentIntent(content: PlanningContent): PlanningPublishIntent {
  if (content.approvalStatus === 'pending') return 'approval'
  if (content.status === 'draft') return 'draft'
  if (content.status === 'scheduled') return 'schedule'
  return 'publish_now'
}

export function canSubmitComposer(draft: PlanningComposerDraft): boolean {
  if (draft.targetIds.length === 0 || draft.caption.trim().length === 0) return false
  if (draft.publishMode !== 'schedule') return true
  if (draft.scheduleMode === 'same_time') return Boolean(draft.scheduledAt)
  return draft.targetIds.every((accountId) => Boolean(draft.accountSchedules[accountId]))
}

export function toCreatePlanningContentInput(
  brandId: string,
  draft: PlanningComposerDraft,
  intent: PlanningPublishIntent,
): CreatePlanningContentInput {
  return {
    brandId,
    platform: draft.platform,
    type: draft.postType,
    caption: draft.caption.trim(),
    link: draft.link.trim() || undefined,
    media: draft.media,
    intent,
    platformSettings: draft.platformSettings,
    publications: draft.targetIds.map((socialAccountId) => ({
      socialAccountId,
      captionOverride: draft.captionOverrides[socialAccountId]?.trim() || undefined,
      scheduledAt:
        intent === 'schedule'
          ? draft.scheduleMode === 'same_time'
            ? new Date(draft.scheduledAt).toISOString()
            : new Date(draft.accountSchedules[socialAccountId]).toISOString()
          : undefined,
    })),
  }
}

export function toUpdatePlanningContentInput(
  brandId: string,
  content: PlanningContent,
  draft: PlanningComposerDraft,
  intent: PlanningPublishIntent,
): UpdatePlanningContentInput {
  return {
    ...toCreatePlanningContentInput(brandId, draft, intent),
    contentId: content.id,
    status: content.status,
    approvalStatus: content.approvalStatus,
  }
}

function inferPostType(content: PlanningContent): PlanningPostType {
  if (content.platform === 'tiktok') {
    return content.mediaType === 'image' ? 'tiktok_photo' : 'tiktok_video'
  }
  return content.mediaType === 'video' ? 'facebook_reel' : 'facebook_feed'
}

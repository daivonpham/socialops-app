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
export type ComposerMedia = PlanningMedia & { file?: File }

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
        ? {}
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
    caption:
      publications.length === 1
        ? (publications[0]?.captionOverride ?? content.caption)
        : content.caption,
    link: content.link ?? '',
    media: content.media ?? fallbackMedia,
    captionOverrides:
      publications.length > 1
        ? Object.fromEntries(
            publications.flatMap((publication) =>
              publication.captionOverride
                ? [[publication.socialAccountId, publication.captionOverride]]
                : [],
            ),
          )
        : {},
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
  if (['draft', 'failed', 'cancelled'].includes(content.status)) return 'draft'
  if (content.status === 'scheduled') return 'schedule'
  return 'publish_now'
}

export function canSubmitComposer(draft: PlanningComposerDraft): boolean {
  if (draft.targetIds.length === 0 || !hasValidContentForPostType(draft)) return false
  if (draft.publishMode !== 'schedule') return true
  if (draft.scheduleMode === 'same_time') return Boolean(draft.scheduledAt)
  return draft.targetIds.every((accountId) => Boolean(draft.accountSchedules[accountId]))
}

function hasValidContentForPostType(draft: PlanningComposerDraft): boolean {
  const caption = draft.caption.trim()
  if (draft.postType === 'facebook_feed') {
    if (draft.link.trim() && draft.media.length) return false
    if (draft.media.some((item) => item.type === 'video') && draft.media.length !== 1) return false
    return Boolean(caption || draft.link.trim() || draft.media.length)
  }
  if (draft.postType === 'facebook_reel' || draft.postType === 'tiktok_video') {
    return draft.media.length === 1 && draft.media[0]?.type === 'video'
  }
  if (draft.postType === 'facebook_story') {
    return draft.media.length === 1
  }
  if (draft.postType === 'tiktok_photo') {
    return draft.media.length > 0 && draft.media.every((media) => media.type === 'image')
  }
  return false
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
    caption: draft.postType === 'facebook_story' ? '' : draft.caption.trim(),
    link: draft.postType === 'facebook_story' ? undefined : draft.link.trim() || undefined,
    media: draft.media.map(({ id, type, url, name }) => ({ id, type, url, name })),
    intent,
    platformSettings: draft.platformSettings,
    publications: draft.targetIds.map((socialAccountId) => ({
      socialAccountId,
      captionOverride:
        draft.postType === 'facebook_story' || draft.targetIds.length <= 1
          ? undefined
          : draft.captionOverrides[socialAccountId]?.trim() || undefined,
      scheduledAt: plannedAt(draft, socialAccountId, intent),
    })),
  }
}

/**
 * A scheduled post must carry its time. Drafts and approval requests keep an optional
 * planned date so moving them on the calendar is not lost when they are edited.
 */
function plannedAt(
  draft: PlanningComposerDraft,
  socialAccountId: string,
  intent: PlanningPublishIntent,
): string | undefined {
  if (intent === 'publish_now') return undefined
  const value =
    draft.scheduleMode === 'same_time'
      ? draft.scheduledAt
      : (draft.accountSchedules[socialAccountId] ?? draft.scheduledAt)
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  // A past planned date is only meaningful for scheduling; drafts silently drop it.
  if (intent !== 'schedule' && date.getTime() <= Date.now()) return undefined
  return date.toISOString()
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
    version: content.version,
  }
}

function inferPostType(content: PlanningContent): PlanningPostType {
  if (content.platform === 'tiktok') {
    return content.mediaType === 'image' ? 'tiktok_photo' : 'tiktok_video'
  }
  return content.mediaType === 'video' ? 'facebook_reel' : 'facebook_feed'
}

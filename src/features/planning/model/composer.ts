import { toPlainCaption } from '@/shared/lib/plainCaption'
import type {
  CreatePlanningContentInput,
  PlanningCaptionMode,
  PlanningContent,
  PlanningMedia,
  PlanningPlatform,
  PlanningPostType,
  PlanningPublishIntent,
  UpdatePlanningContentInput,
} from '../api'

export type PreviewViewport = 'mobile' | 'desktop'
export type ScheduleMode = 'same_time' | 'by_account'
/** `file` is set until the picked file is stored; `size` (bytes) stays for showing it. */
export type ComposerMedia = PlanningMedia & { file?: File; size?: number }

/**
 * A Reel's cover: a frame of the video (`time` in seconds) or a picture of the user's own. A frame
 * cover follows the video, so replacing the video drops it; an uploaded one stays.
 */
export type ComposerThumbnail = ComposerMedia & {
  source: 'frame' | 'upload'
  time?: number
  /** The video a frame cover was taken from. */
  videoId?: string
}

export type PlanningComposerDraft = {
  platform: PlanningPlatform
  postType: PlanningPostType
  targetIds: string[]
  caption: string
  link: string
  media: ComposerMedia[]
  /** Only Reels have one; other post types ignore it. */
  thumbnail: ComposerThumbnail | null
  captionMode: PlanningCaptionMode
  /** Per-Page captions. Kept while the per-Page mode is off so turning it back on restores them. */
  captionOverrides: Record<string, string>
  publishMode: 'publish_now' | 'schedule'
  scheduleMode: ScheduleMode
  scheduledAt: string
  accountSchedules: Record<string, string>
  platformSettings: Record<string, boolean | string>
}

/** What "Use" on an AI suggestion fills the composer with. */
export type ComposerAiSuggestion = {
  socialAccountIds: string[]
  captions: Record<string, string>
  /** The caption of a suggestion made without Pages: the post screen picks them. */
  generalCaption?: string
  images: Array<{ id: string; url: string; name: string }>
}

/**
 * A Facebook post filled from an AI suggestion, for Pages still in `accountIds`. Pages with
 * different captions get them each; the same caption everywhere stays shared. Markdown comes off.
 */
export function createComposerDraftFromAiSuggestion(
  suggestion: ComposerAiSuggestion,
  accountIds: string[],
): PlanningComposerDraft {
  const targetIds = suggestion.socialAccountIds.filter((id) => accountIds.includes(id))
  // The post screen edits plain text, as the Page will show it; the Markdown stays in the chat.
  const captions = targetIds.map((id) => toPlainCaption(suggestion.captions[id] ?? ''))
  const caption = captions[0] ?? toPlainCaption(suggestion.generalCaption ?? '')
  const perAccount = targetIds.length > 1 && captions.some((text) => text !== caption)
  return {
    ...createComposerDraft('facebook'),
    targetIds,
    caption,
    captionMode: perAccount ? 'per_target' : 'shared',
    captionOverrides: perAccount
      ? Object.fromEntries(targetIds.map((id, index) => [id, captions[index] ?? '']))
      : {},
    media: suggestion.images.map(({ id, url, name }) => ({
      id,
      type: 'image' as const,
      url,
      name,
    })),
  }
}

export function createComposerDraft(platform: PlanningPlatform): PlanningComposerDraft {
  return {
    platform,
    postType: platform === 'facebook' ? 'facebook_feed' : 'tiktok_video',
    targetIds: [],
    caption: '',
    link: '',
    media: [],
    thumbnail: null,
    captionMode: 'shared',
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

/** Per-Page captions only apply to a post with several Pages that has a caption at all. */
export function supportsCaptionPerAccount(draft: PlanningComposerDraft): boolean {
  return draft.targetIds.length > 1 && draft.postType !== 'facebook_story'
}

export function usesCaptionPerAccount(draft: PlanningComposerDraft): boolean {
  return draft.captionMode === 'per_target' && supportsCaptionPerAccount(draft)
}

/** The caption a Page publishes with the current draft. */
export function composerCaptionFor(draft: PlanningComposerDraft, accountId: string): string {
  return usesCaptionPerAccount(draft) ? (draft.captionOverrides[accountId] ?? '') : draft.caption
}

/** Turning per-Page captions on starts every empty Page from the shared caption. */
export function setComposerCaptionMode(
  draft: PlanningComposerDraft,
  captionMode: PlanningCaptionMode,
): PlanningComposerDraft {
  if (captionMode === 'shared') return { ...draft, captionMode }
  return {
    ...draft,
    captionMode,
    captionOverrides: {
      ...draft.captionOverrides,
      ...Object.fromEntries(
        draft.targetIds
          .filter((accountId) => !draft.captionOverrides[accountId]?.trim())
          .map((accountId) => [accountId, draft.caption]),
      ),
    },
  }
}

/** A feed post needs text, a link or media on every Page. */
export function isComposerCaptionMissing(
  draft: PlanningComposerDraft,
  accountId?: string,
): boolean {
  if (draft.postType !== 'facebook_feed' || draft.link.trim() || draft.media.length) return false
  const accountIds = accountId ? [accountId] : draft.targetIds
  return usesCaptionPerAccount(draft)
    ? accountIds.some((id) => !composerCaptionFor(draft, id).trim())
    : !draft.caption.trim()
}

export function createComposerDraftFromContent(content: PlanningContent): PlanningComposerDraft {
  const defaults = createComposerDraft(content.platform)
  // A Page removed from the post stays as cancelled for its history; it is not a target any
  // more, so the form leaves it out unless the whole post was cancelled.
  const allPublications = content.publications ?? []
  const activePublications = allPublications.filter(
    (publication) => publication.status !== 'cancelled',
  )
  const publications = activePublications.length ? activePublications : allPublications
  const captionMode =
    content.captionMode ??
    (publications.some((publication) => publication.captionOverride) ? 'per_target' : 'shared')
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
    thumbnail: content.thumbnail ? { ...content.thumbnail, source: 'upload' } : null,
    captionMode: publications.length > 1 ? captionMode : 'shared',
    captionOverrides:
      publications.length > 1 && captionMode === 'per_target'
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

/** Intents that need a publish time for every target. */
export function isScheduleIntent(intent: PlanningPublishIntent): boolean {
  return intent === 'schedule' || intent === 'approval_schedule'
}

/** Without `publish_direct`, publishing goes through approval the same way (now or scheduled). */
export function allowedIntent(
  intent: PlanningPublishIntent,
  canPublishDirect: boolean,
): PlanningPublishIntent {
  if (canPublishDirect) return intent
  if (intent === 'publish_now') return 'approval_publish_now'
  if (intent === 'schedule') return 'approval_schedule'
  return intent
}

export function getPlanningContentIntent(
  content: PlanningContent,
  canPublishDirect: boolean,
): PlanningPublishIntent {
  if (content.approvalStatus === 'pending')
    return content.approvalIntent === 'schedule' ? 'approval_schedule' : 'approval_publish_now'
  if (['draft', 'failed', 'cancelled'].includes(content.status)) return 'draft'
  return allowedIntent(
    content.status === 'scheduled' ? 'schedule' : 'publish_now',
    canPublishDirect,
  )
}

export function canSubmitComposer(draft: PlanningComposerDraft): boolean {
  if (draft.targetIds.length === 0 || !hasValidContentForPostType(draft)) return false
  if (draft.publishMode !== 'schedule') return true
  if (draft.scheduleMode === 'same_time') return Boolean(draft.scheduledAt)
  return draft.targetIds.every((accountId) => Boolean(draft.accountSchedules[accountId]))
}

function hasValidContentForPostType(draft: PlanningComposerDraft): boolean {
  if (draft.postType === 'facebook_feed') {
    if (draft.link.trim() && draft.media.length) return false
    if (draft.media.some((item) => item.type === 'video') && draft.media.length !== 1) return false
    return !isComposerCaptionMissing(draft)
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
  const perAccount = usesCaptionPerAccount(draft)
  return {
    brandId,
    platform: draft.platform,
    type: draft.postType,
    caption: draft.postType === 'facebook_story' ? '' : draft.caption.trim(),
    captionMode: perAccount ? 'per_target' : 'shared',
    link: draft.postType === 'facebook_story' ? undefined : draft.link.trim() || undefined,
    media: draft.media.map(({ id, type, url, name }) => ({ id, type, url, name })),
    thumbnail:
      draft.postType === 'facebook_reel' && draft.thumbnail
        ? {
            id: draft.thumbnail.id,
            type: 'image',
            url: draft.thumbnail.url,
            name: draft.thumbnail.name,
          }
        : null,
    intent,
    platformSettings: draft.platformSettings,
    publications: draft.targetIds.map((socialAccountId) => ({
      socialAccountId,
      captionOverride: perAccount ? composerCaptionFor(draft, socialAccountId).trim() : undefined,
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
  if (!isScheduleIntent(intent) && date.getTime() <= Date.now()) return undefined
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

import type {
  CreatePlanningContentInput,
  PlanningMedia,
  PlanningPlatform,
  PlanningPostType,
  PlanningPublishIntent,
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

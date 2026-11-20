import type { PlanningPlatform } from '../api'

/**
 * Both platforms can be planned. Whether TikTok posts actually go out is the API's call
 * (`TIKTOK_PUBLISH_ENABLED`, once the media domain is verified with TikTok); it answers with
 * `TIKTOK_PUBLISHING_DISABLED` until then, and drafts can always be saved.
 */
export function canPublishOnPlatform(platform: PlanningPlatform): boolean {
  return platform === 'facebook' || platform === 'tiktok'
}

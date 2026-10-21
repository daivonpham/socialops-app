import type { PlanningPlatform } from '../api'

// Enable TikTok only after the backend worker and TikTok app/domain approvals are verified.
export function canPublishOnPlatform(platform: PlanningPlatform): boolean {
  return platform === 'facebook'
}

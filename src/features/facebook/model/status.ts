import type { StatusTone } from '@/shared/ui'
import type { FacebookPageHealth, PostStatus } from '../api'

export const HEALTH_TONE: Record<FacebookPageHealth, StatusTone> = {
  connected: 'success',
  token_expiring: 'warning',
  permission_missing: 'error',
  disconnected: 'neutral',
}
export const POST_TONE: Record<PostStatus, StatusTone> = {
  draft: 'neutral',
  scheduled: 'info',
  publishing: 'brand',
  published: 'success',
  failed: 'error',
}

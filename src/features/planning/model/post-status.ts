import type { PostStatus } from '@/features/facebook'
import type { StatusTone } from '@/shared/ui'

export const POST_STATUS_TONE: Record<PostStatus, StatusTone> = {
  draft: 'neutral',
  scheduled: 'info',
  publishing: 'warning',
  published: 'success',
  failed: 'error',
}

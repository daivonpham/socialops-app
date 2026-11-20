import type { StatusTone } from '@/shared/ui'
import type { TikTokAccountHealth } from '../api'

export const HEALTH_TONE: Record<TikTokAccountHealth, StatusTone> = {
  connected: 'success',
  token_expiring: 'warning',
  permission_missing: 'error',
  reconnect_required: 'error',
}

import type { StatusTone } from '@/shared/ui'
import type { FacebookPageHealth } from '../api'

export const HEALTH_TONE: Record<FacebookPageHealth, StatusTone> = {
  connected: 'success',
  token_expiring: 'warning',
  permission_missing: 'error',
  disconnected: 'neutral',
}

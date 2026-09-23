import { isAxiosError } from 'axios'
import type { ApiErrorResponse } from '@/shared/api/types'

const ERROR_KEYS = {
  INVALID_CREDENTIALS: 'errors.INVALID_CREDENTIALS',
  CURRENT_PASSWORD_INCORRECT: 'errors.CURRENT_PASSWORD_INCORRECT',
  EMAIL_NOT_VERIFIED: 'errors.EMAIL_NOT_VERIFIED',
  EMAIL_ALREADY_REGISTERED: 'errors.EMAIL_ALREADY_REGISTERED',
  INVALID_OR_EXPIRED_TOKEN: 'errors.INVALID_OR_EXPIRED_TOKEN',
  OAUTH_NOT_CONFIGURED: 'errors.OAUTH_NOT_CONFIGURED',
} as const

export function getAuthErrorKey(error: unknown) {
  if (!isAxiosError<ApiErrorResponse>(error)) return 'errors.UNKNOWN' as const
  const code = error.response?.data.error.code
  return (code && ERROR_KEYS[code as keyof typeof ERROR_KEYS]) || ('errors.UNKNOWN' as const)
}

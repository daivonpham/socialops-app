import { apiClient } from '@/shared/api/client'
import { isApiErrorCode } from '@/shared/api/errors'
import type { CommonApiResponse } from '@/shared/api/types'
import type { GoogleConnection } from './types'

const root = '/users/me/integrations/google'

export async function getGoogleConnection() {
  const response = await apiClient.get<CommonApiResponse<GoogleConnection>>(root)
  return response.data.data
}

export async function startGoogleConnect() {
  const response = await apiClient.post<CommonApiResponse<{ authorizationUrl: string }>>(
    `${root}/connect`,
  )
  return response.data.data
}

export async function disconnectGoogle() {
  await apiClient.delete(root)
}

/** API errors that mean the user has to (re)grant Google access before exporting. */
const NEEDS_CONSENT = [
  'GOOGLE_NOT_CONNECTED',
  'GOOGLE_REAUTHORIZATION_REQUIRED',
  'GOOGLE_PERMISSION_MISSING',
] as const

export function needsGoogleConsent(error: unknown): boolean {
  return isApiErrorCode(error, NEEDS_CONSENT)
}

/** The user closed the Google consent popup or pressed Cancel: not a failure to report. */
export function isGoogleConsentCancelled(error: unknown): boolean {
  return isApiErrorCode(error, 'GOOGLE_AUTH_CANCELLED')
}

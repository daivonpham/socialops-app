import { isAxiosError } from 'axios'
import { apiClient } from '@/shared/api/client'
import type { ApiErrorResponse, CommonApiResponse } from '@/shared/api/types'
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
const NEEDS_CONSENT = new Set([
  'GOOGLE_NOT_CONNECTED',
  'GOOGLE_REAUTHORIZATION_REQUIRED',
  'GOOGLE_PERMISSION_MISSING',
])

export function googleErrorCode(error: unknown): string | undefined {
  return isAxiosError<ApiErrorResponse>(error) ? error.response?.data?.error?.code : undefined
}

export function needsGoogleConsent(error: unknown): boolean {
  return NEEDS_CONSENT.has(googleErrorCode(error) ?? '')
}

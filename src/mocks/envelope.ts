import type { CommonApiResponse } from '@/shared/api/types'

/** Wraps mock data in the same envelope the real backend uses. */
export function envelope<T>(data: T, path: string): CommonApiResponse<T> {
  return {
    success: true,
    statusCode: 200,
    message: 'OK',
    data,
    timestamp: new Date().toISOString(),
    path,
  }
}

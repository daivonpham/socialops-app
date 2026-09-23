import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type { AuthUser } from '@/shared/auth'

export async function updateProfile(displayName: string, locale: 'vi' | 'en') {
  const { data } = await apiClient.patch<CommonApiResponse<AuthUser>>('/users/me', {
    displayName,
    locale,
  })
  return data.data
}

export async function uploadAvatar(file: File) {
  const body = new FormData()
  body.append('avatar', file)
  const { data } = await apiClient.post<CommonApiResponse<AuthUser>>('/users/me/avatar', body)
  return data.data
}

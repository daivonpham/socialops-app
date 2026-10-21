import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type { TikTokCreatorInfoDto, TikTokIntegrationDto } from './types'

export async function getTikTokIntegration(brandId: string) {
  const { data } = await apiClient.get<CommonApiResponse<TikTokIntegrationDto>>(
    `/brands/${brandId}/tiktok`,
  )
  return data.data
}

export async function startTikTokConnect(brandId: string) {
  const { data } = await apiClient.post<CommonApiResponse<{ authorizationUrl: string }>>(
    `/brands/${brandId}/social-accounts/tiktok/connect`,
    {},
  )
  return data.data
}

export async function disconnectTikTok(brandId: string) {
  const { data } = await apiClient.delete<CommonApiResponse<TikTokIntegrationDto>>(
    `/brands/${brandId}/tiktok`,
  )
  return data.data
}

export async function getTikTokCreatorInfo(brandId: string, accountId: string) {
  const { data } = await apiClient.get<CommonApiResponse<TikTokCreatorInfoDto>>(
    `/brands/${brandId}/tiktok/creator-info`,
    { params: { accountId } },
  )
  return data.data
}

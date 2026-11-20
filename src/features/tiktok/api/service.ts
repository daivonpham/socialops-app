import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  TikTokCreatorInfoDto,
  TikTokDashboardDto,
  TikTokIntegrationDto,
  TikTokQuery,
  TikTokVideoDetailDto,
  TikTokVideosDto,
  TikTokVideosQuery,
} from './types'

const params = (query: TikTokQuery) => ({
  accountId: query.accountId,
  range: query.range,
  since: query.since || undefined,
  until: query.until || undefined,
  compare: query.compare,
})

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

export async function disconnectTikTokAccount(brandId: string, accountId: string) {
  const { data } = await apiClient.delete<CommonApiResponse<TikTokIntegrationDto>>(
    `/brands/${brandId}/tiktok/accounts/${accountId}`,
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

export async function getTikTokDashboard(brandId: string, query: TikTokQuery) {
  const { data } = await apiClient.get<CommonApiResponse<TikTokDashboardDto>>(
    `/brands/${brandId}/tiktok/dashboard`,
    { params: params(query) },
  )
  return data.data
}

export async function getTikTokVideos(brandId: string, query: TikTokVideosQuery) {
  const { data } = await apiClient.get<CommonApiResponse<TikTokVideosDto>>(
    `/brands/${brandId}/tiktok/videos`,
    {
      params: {
        ...params(query),
        search: query.search || undefined,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        page: query.page,
        limit: query.limit,
      },
    },
  )
  return data.data
}

export async function getTikTokVideo(brandId: string, videoId: string) {
  const { data } = await apiClient.get<CommonApiResponse<TikTokVideoDetailDto>>(
    `/brands/${brandId}/tiktok/videos/${encodeURIComponent(videoId)}`,
  )
  return data.data
}

export async function refreshTikTok(brandId: string, accountId?: string) {
  const { data } = await apiClient.post<
    CommonApiResponse<{ queued: number; refreshAvailableAt: string | null }>
  >(`/brands/${brandId}/tiktok/sync`, {}, { params: { accountId } })
  return data.data
}

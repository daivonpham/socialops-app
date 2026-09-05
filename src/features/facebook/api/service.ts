import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  ConnectFacebookInput,
  CreateFacebookPostInput,
  FacebookAnalyticsDto,
  FacebookIntegrationDto,
  FacebookOverviewDto,
  FacebookPageActionInput,
  FacebookPostQuery,
  FacebookPostDto,
  FacebookPostsDto,
  FacebookQuery,
} from './types'

export async function getFacebookIntegration(brandId: string) {
  return (
    await apiClient.get<CommonApiResponse<FacebookIntegrationDto>>(`/brands/${brandId}/facebook`)
  ).data
}

export async function startFacebookConnect({ brandId }: ConnectFacebookInput) {
  return (
    await apiClient.post<CommonApiResponse<FacebookIntegrationDto>>(
      `/brands/${brandId}/facebook/connect`,
    )
  ).data
}

export async function reconnectFacebookPage({ brandId, pageId }: FacebookPageActionInput) {
  return (
    await apiClient.post<CommonApiResponse<FacebookIntegrationDto>>(
      `/brands/${brandId}/facebook/pages/${pageId}/reconnect`,
    )
  ).data
}

export async function disconnectFacebookPage({ brandId, pageId }: FacebookPageActionInput) {
  return (
    await apiClient.delete<CommonApiResponse<FacebookIntegrationDto>>(
      `/brands/${brandId}/facebook/pages/${pageId}`,
    )
  ).data
}

export async function disconnectFacebook(brandId: string) {
  return (
    await apiClient.delete<CommonApiResponse<FacebookIntegrationDto>>(`/brands/${brandId}/facebook`)
  ).data
}

export async function getFacebookOverview(brandId: string, query: FacebookQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookOverviewDto>>(
      `/brands/${brandId}/facebook/overview`,
      { params: query },
    )
  ).data
}

export async function getFacebookPosts(brandId: string, query: FacebookPostQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookPostsDto>>(`/brands/${brandId}/facebook/posts`, {
      params: query,
    })
  ).data
}

export async function getFacebookAnalytics(brandId: string, query: FacebookQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookAnalyticsDto>>(
      `/brands/${brandId}/facebook/analytics`,
      { params: query },
    )
  ).data
}

export async function createFacebookPost(input: CreateFacebookPostInput) {
  const { brandId, ...body } = input
  return (
    await apiClient.post<CommonApiResponse<FacebookPostDto[]>>(
      `/brands/${brandId}/facebook/posts`,
      body,
    )
  ).data
}

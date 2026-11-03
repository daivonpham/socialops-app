import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  ConnectFacebookInput,
  CreateFacebookPostInput,
  FacebookDetailsDto,
  FacebookIntegrationDto,
  FacebookOverviewDetailsDto,
  FacebookOverviewSummaryDto,
  FacebookDashboardDto,
  FacebookPageActionInput,
  FacebookPostQuery,
  FacebookPostDto,
  FacebookRecentPostsDto,
  FacebookRecentPostsQuery,
  FacebookPostsDto,
  FacebookQuery,
  FacebookAvailablePageDto,
  FacebookSyncStatusDto,
  FacebookOAuthStartDto,
  SelectFacebookPagesInput,
} from './types'

export async function getFacebookIntegration(brandId: string) {
  return (
    await apiClient.get<CommonApiResponse<FacebookIntegrationDto>>(`/brands/${brandId}/facebook`)
  ).data
}

export async function startFacebookConnect({ brandId }: ConnectFacebookInput) {
  const { data } = await apiClient.post<CommonApiResponse<FacebookOAuthStartDto>>(
    `/brands/${brandId}/social-accounts/facebook/connect`,
    {},
  )
  return data.data
}

export async function getAvailableFacebookPages(brandId: string, connectionId: string) {
  const { data } = await apiClient.get<CommonApiResponse<FacebookAvailablePageDto[]>>(
    `/brands/${brandId}/social-accounts/facebook/connections/${connectionId}/pages`,
  )
  return data.data
}

export async function selectFacebookPages({
  brandId,
  connectionId,
  pageIds,
}: SelectFacebookPagesInput) {
  const { data } = await apiClient.post<CommonApiResponse<unknown>>(
    `/brands/${brandId}/social-accounts/facebook/select`,
    { connectionId, pageIds },
  )
  return data.data
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

export async function getFacebookDashboard(brandId: string, query: FacebookQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookDashboardDto>>(
      `/brands/${brandId}/facebook/dashboard`,
      { params: query },
    )
  ).data
}

export async function getFacebookOverviewSummary(brandId: string, query: FacebookQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookOverviewSummaryDto>>(
      `/brands/${brandId}/facebook/overview/summary`,
      { params: query },
    )
  ).data
}

export async function getFacebookOverviewDetails(brandId: string, query: FacebookQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookOverviewDetailsDto>>(
      `/brands/${brandId}/facebook/overview/details`,
      { params: query },
    )
  ).data
}

export async function getFacebookRecentPosts(brandId: string, query: FacebookRecentPostsQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookRecentPostsDto>>(
      `/brands/${brandId}/facebook/recent-posts`,
      { params: query },
    )
  ).data
}

export async function getFacebookDetails(brandId: string, query: FacebookQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookDetailsDto>>(
      `/brands/${brandId}/facebook/details`,
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

export async function createFacebookPost(input: CreateFacebookPostInput) {
  const { brandId, ...body } = input
  return (
    await apiClient.post<CommonApiResponse<FacebookPostDto[]>>(
      `/brands/${brandId}/facebook/posts`,
      body,
    )
  ).data
}

export async function getFacebookSyncStatus(brandId: string) {
  return (
    await apiClient.get<CommonApiResponse<FacebookSyncStatusDto>>(
      `/brands/${brandId}/facebook/sync`,
    )
  ).data
}

export async function requestFacebookSync(brandId: string) {
  return (
    await apiClient.post<CommonApiResponse<FacebookSyncStatusDto>>(
      `/brands/${brandId}/facebook/sync`,
      {},
    )
  ).data
}

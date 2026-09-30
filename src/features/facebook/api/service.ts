import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  ConnectFacebookInput,
  CreateFacebookPostInput,
  FacebookAnalyticsDto,
  FacebookAnalyticsDetailsDto,
  FacebookAnalyticsSummaryDto,
  FacebookDetailsDto,
  FacebookIntegrationDto,
  FacebookOverviewDto,
  FacebookOverviewDetailsDto,
  FacebookOverviewSummaryDto,
  FacebookPageActionInput,
  FacebookPostQuery,
  FacebookPostDto,
  FacebookPostsDto,
  FacebookQuery,
  FacebookAvailablePageDto,
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

export async function getFacebookOverview(brandId: string, query: FacebookQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookOverviewDto>>(
      `/brands/${brandId}/facebook/overview`,
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

export async function getFacebookAnalytics(brandId: string, query: FacebookQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookAnalyticsDto>>(
      `/brands/${brandId}/facebook/analytics`,
      { params: query },
    )
  ).data
}

export async function getFacebookAnalyticsSummary(brandId: string, query: FacebookQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookAnalyticsSummaryDto>>(
      `/brands/${brandId}/facebook/analytics/summary`,
      { params: query },
    )
  ).data
}

export async function getFacebookAnalyticsDetails(brandId: string, query: FacebookQuery) {
  return (
    await apiClient.get<CommonApiResponse<FacebookAnalyticsDetailsDto>>(
      `/brands/${brandId}/facebook/analytics/details`,
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

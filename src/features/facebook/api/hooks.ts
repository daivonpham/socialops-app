import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SOCIAL_ACCOUNT_QUERY_KEYS, type SocialAccountCounts } from '@/features/social-accounts'
import type { CommonApiResponse } from '@/shared/api/types'
import {
  createFacebookPost,
  disconnectFacebook,
  disconnectFacebookPage,
  getFacebookAnalytics,
  getFacebookAnalyticsDetails,
  getFacebookAnalyticsSummary,
  getFacebookDetails,
  getAvailableFacebookPages,
  getFacebookIntegration,
  getFacebookOverview,
  getFacebookOverviewDetails,
  getFacebookOverviewSummary,
  getFacebookPosts,
  reconnectFacebookPage,
  selectFacebookPages,
  startFacebookConnect,
} from './service'
import type {
  ConnectFacebookInput,
  FacebookPostQuery,
  FacebookQuery,
  SelectFacebookPagesInput,
} from './types'

export const FACEBOOK_QUERY_KEYS = {
  root: (brandId: string | null) => ['facebook', brandId] as const,
  integration: (brandId: string | null) => ['facebook', brandId, 'integration'] as const,
  availablePages: (brandId: string | null, connectionId: string | null) =>
    ['facebook', brandId, 'available-pages', connectionId] as const,
  details: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'details', query] as const,

  overview: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'overview', query] as const,
  overviewSummary: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'overview', 'summary', query] as const,
  overviewDetails: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'overview', 'details', query] as const,
  posts: (brandId: string | null, query: FacebookPostQuery) =>
    ['facebook', brandId, 'posts', query] as const,
  analytics: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'analytics', query] as const,
  analyticsSummary: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'analytics', 'summary', query] as const,
  analyticsDetails: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'analytics', 'details', query] as const,
}

export function useFacebookIntegration(brandId: string | null) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.integration(brandId),
    queryFn: () => getFacebookIntegration(brandId!),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

export function useFacebookOverview(brandId: string | null, query: FacebookQuery) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.overview(brandId, query),
    queryFn: () => getFacebookOverview(brandId!, query),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

export function useFacebookOverviewSummary(brandId: string | null, query: FacebookQuery) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.overviewSummary(brandId, query),
    queryFn: () => getFacebookOverviewSummary(brandId!, query),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

export function useFacebookDetails(brandId: string | null, query: FacebookQuery) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.details(brandId, query),
    queryFn: () => getFacebookDetails(brandId!, query),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

export function useFacebookOverviewDetails(brandId: string | null, query: FacebookQuery) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.overviewDetails(brandId, query),
    queryFn: () => getFacebookOverviewDetails(brandId!, query),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

export function useFacebookPosts(brandId: string | null, query: FacebookPostQuery) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.posts(brandId, query),
    queryFn: () => getFacebookPosts(brandId!, query),
    enabled: brandId !== null,
    select: (response) => response.data,
    placeholderData: (previous) => previous,
  })
}

export function useFacebookAnalytics(brandId: string | null, query: FacebookQuery) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.analytics(brandId, query),
    queryFn: () => getFacebookAnalytics(brandId!, query),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

export function useFacebookAnalyticsSummary(brandId: string | null, query: FacebookQuery) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.analyticsSummary(brandId, query),
    queryFn: () => getFacebookAnalyticsSummary(brandId!, query),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

export function useFacebookAnalyticsDetails(brandId: string | null, query: FacebookQuery) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.analyticsDetails(brandId, query),
    queryFn: () => getFacebookAnalyticsDetails(brandId!, query),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

function useFacebookMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  brandId: string | null,
) {
  const client = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async (response) => {
      const payload = (response as CommonApiResponse<unknown>).data
      const pages =
        payload && typeof payload === 'object' && 'pages' in payload ? payload.pages : undefined
      if (Array.isArray(pages)) {
        client.setQueryData<CommonApiResponse<SocialAccountCounts>>(
          SOCIAL_ACCOUNT_QUERY_KEYS.counts(brandId),
          (current) =>
            current ? { ...current, data: { ...current.data, facebook: pages.length } } : current,
        )
      }
      await client.invalidateQueries({ queryKey: FACEBOOK_QUERY_KEYS.root(brandId) })
    },
  })
}

export function useConnectFacebook() {
  return useMutation({
    mutationFn: async (input: ConnectFacebookInput) => {
      const width = 720
      const height = 760
      const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
      const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)
      const popup = window.open(
        'about:blank',
        'socialops-facebook-oauth',
        `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
      )
      try {
        const result = await startFacebookConnect(input)
        return { ...result, popup }
      } catch (error) {
        popup?.close()
        throw error
      }
    },
    onSuccess: ({ authorizationUrl, popup }) => {
      if (popup) popup.location.href = authorizationUrl
      else window.location.assign(authorizationUrl)
    },
  })
}

export function useAvailableFacebookPages(brandId: string | null, connectionId: string | null) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.availablePages(brandId, connectionId),
    queryFn: () => getAvailableFacebookPages(brandId!, connectionId!),
    enabled: brandId !== null && connectionId !== null,
  })
}

export function useSelectFacebookPages(brandId: string | null) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: SelectFacebookPagesInput) => selectFacebookPages(input),
    onSuccess: () => {
      void Promise.all([
        client.invalidateQueries({ queryKey: FACEBOOK_QUERY_KEYS.integration(brandId) }),
        client.invalidateQueries({ queryKey: SOCIAL_ACCOUNT_QUERY_KEYS.counts(brandId) }),
      ])
    },
  })
}

export function useReconnectFacebookPage(brandId: string | null) {
  return useFacebookMutation(reconnectFacebookPage, brandId)
}
export function useDisconnectFacebookPage(brandId: string | null) {
  return useFacebookMutation(disconnectFacebookPage, brandId)
}
export function useDisconnectFacebook(brandId: string | null) {
  return useFacebookMutation(disconnectFacebook, brandId)
}
export function useCreateFacebookPost(brandId: string | null) {
  return useFacebookMutation(createFacebookPost, brandId)
}

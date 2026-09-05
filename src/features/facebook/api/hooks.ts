import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SOCIAL_ACCOUNT_QUERY_KEYS, type SocialAccountCounts } from '@/features/social-accounts'
import type { CommonApiResponse } from '@/shared/api/types'
import {
  createFacebookPost,
  disconnectFacebook,
  disconnectFacebookPage,
  getFacebookAnalytics,
  getFacebookIntegration,
  getFacebookOverview,
  getFacebookPosts,
  reconnectFacebookPage,
  startFacebookConnect,
} from './service'
import type { FacebookPostQuery, FacebookQuery } from './types'

export const FACEBOOK_QUERY_KEYS = {
  root: (brandId: string | null) => ['facebook', brandId] as const,
  integration: (brandId: string | null) => ['facebook', brandId, 'integration'] as const,

  overview: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'overview', query] as const,
  posts: (brandId: string | null, query: FacebookPostQuery) =>
    ['facebook', brandId, 'posts', query] as const,
  analytics: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'analytics', query] as const,
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

export function useConnectFacebook(brandId: string | null) {
  return useFacebookMutation(startFacebookConnect, brandId)
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

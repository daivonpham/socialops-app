import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SOCIAL_ACCOUNT_QUERY_KEYS, type SocialAccountCounts } from '@/features/social-accounts'
import type { CommonApiResponse } from '@/shared/api/types'
import {
  createFacebookPost,
  disconnectFacebook,
  disconnectFacebookPage,
  getFacebookDashboard,
  getFacebookDetails,
  getAvailableFacebookPages,
  getFacebookIntegration,
  getFacebookRecentPosts,
  getFacebookSyncStatus,
  requestFacebookSync,
  getFacebookOverviewSummary,
  getFacebookPosts,
  reconnectFacebookPage,
  selectFacebookPages,
  startFacebookConnect,
} from './service'
import type {
  ConnectFacebookInput,
  FacebookPostQuery,
  FacebookRecentPostsQuery,
  FacebookQuery,
  SelectFacebookPagesInput,
} from './types'

export const FACEBOOK_QUERY_KEYS = {
  root: (brandId: string | null) => ['facebook', brandId] as const,
  integration: (brandId: string | null) => ['facebook', brandId, 'integration'] as const,
  sync: (brandId: string | null) => ['facebook', brandId, 'sync'] as const,
  availablePages: (brandId: string | null, connectionId: string | null) =>
    ['facebook', brandId, 'available-pages', connectionId] as const,
  details: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'details', query] as const,

  dashboard: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'dashboard', query] as const,
  overviewSummary: (brandId: string | null, query: FacebookQuery) =>
    ['facebook', brandId, 'overview', 'summary', query] as const,
  recentPosts: (brandId: string | null, query: FacebookRecentPostsQuery) =>
    ['facebook', brandId, 'recent-posts', query] as const,
  posts: (brandId: string | null, query: FacebookPostQuery) =>
    ['facebook', brandId, 'posts', query] as const,
}

export function useFacebookIntegration(brandId: string | null) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.integration(brandId),
    queryFn: () => getFacebookIntegration(brandId!),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

export function useFacebookSyncStatus(brandId: string | null) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.sync(brandId),
    queryFn: () => getFacebookSyncStatus(brandId!),
    enabled: brandId !== null,
    select: (response) => response.data,
    // Poll quickly while a Page is syncing so new data appears as soon as it lands.
    refetchInterval: (query) => (query.state.data?.data.syncing ? 10_000 : 60_000),
  })
}

export function useRequestFacebookSync(brandId: string | null) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => requestFacebookSync(brandId!),
    onSuccess: (response) => {
      client.setQueryData(FACEBOOK_QUERY_KEYS.sync(brandId), response)
    },
  })
}

export function useFacebookDashboard(brandId: string | null, query: FacebookQuery) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.dashboard(brandId, query),
    queryFn: () => getFacebookDashboard(brandId!, query),
    enabled: brandId !== null,
    select: (response) => response.data,
    // Switching period or Page keeps the previous numbers on screen until the new ones arrive.
    placeholderData: (previous) => previous,
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

export function useFacebookRecentPosts(
  brandId: string | null,
  query: FacebookRecentPostsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: FACEBOOK_QUERY_KEYS.recentPosts(brandId, query),
    queryFn: () => getFacebookRecentPosts(brandId!, query),
    enabled: brandId !== null && enabled,
    select: (response) => response.data,
    placeholderData: (previous) => previous,
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
/**
 * The Page manager's Reconnect for any screen: re-check each Page with the stored Facebook
 * grant (this also stores its fresh Page token) and, when Facebook no longer grants a Page,
 * fall back to logging in to Facebook again, which restores every Page ticked there.
 */
export function useReconnectFacebookPages(brandId: string | null) {
  const reconnectPage = useReconnectFacebookPage(brandId)
  const connect = useConnectFacebook()
  const reconnect = async (pageIds: string[]): Promise<'reconnected' | 'login'> => {
    if (!brandId) throw new Error('A Brand is required to reconnect Facebook Pages')
    try {
      for (const pageId of pageIds) await reconnectPage.mutateAsync({ brandId, pageId })
      return 'reconnected'
    } catch {
      await connect.mutateAsync({ brandId })
      return 'login'
    }
  }
  return { reconnect, isPending: reconnectPage.isPending || connect.isPending }
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

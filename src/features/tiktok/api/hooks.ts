import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { SOCIAL_ACCOUNT_QUERY_KEYS } from '@/features/social-accounts'
import {
  disconnectTikTokAccount,
  getTikTokCreatorInfo,
  getTikTokDashboard,
  getTikTokIntegration,
  getTikTokVideo,
  getTikTokVideos,
  refreshTikTok,
  startTikTokConnect,
} from './service'
import type { TikTokIntegrationDto, TikTokQuery, TikTokVideosQuery } from './types'

export const TIKTOK_QUERY_KEYS = {
  root: (brandId: string | null) => ['tiktok', brandId] as const,
  integration: (brandId: string | null) => ['tiktok', brandId, 'integration'] as const,
  creatorInfo: (brandId: string | null, accountId: string | null) =>
    ['tiktok', brandId, 'creator-info', accountId] as const,
  dashboard: (brandId: string | null, query: TikTokQuery) =>
    ['tiktok', brandId, 'dashboard', query] as const,
  videos: (brandId: string | null, query: TikTokVideosQuery) =>
    ['tiktok', brandId, 'videos', query] as const,
  video: (brandId: string | null, videoId: string | null) =>
    ['tiktok', brandId, 'video', videoId] as const,
}

/** Polls while an account has never finished a sync, so the first figures show up on their own. */
function isWaitingForFirstSync(data: TikTokIntegrationDto | undefined): boolean {
  return Boolean(data?.accounts.some((account) => !account.sync.lastSyncedAt))
}

export function useTikTokIntegration(brandId: string | null) {
  return useQuery({
    queryKey: TIKTOK_QUERY_KEYS.integration(brandId),
    queryFn: () => getTikTokIntegration(brandId!),
    enabled: Boolean(brandId),
    refetchInterval: (query) => (isWaitingForFirstSync(query.state.data) ? 5_000 : false),
  })
}

export function useTikTokCreatorInfo(brandId: string | null, accountId: string | null) {
  return useQuery({
    queryKey: TIKTOK_QUERY_KEYS.creatorInfo(brandId, accountId),
    queryFn: () => getTikTokCreatorInfo(brandId!, accountId!),
    enabled: Boolean(brandId && accountId),
    // TikTok requires fresh creator info whenever the post screen is shown.
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  })
}

/**
 * Fresh creator info for every account a post goes to. TikTok requires it each time the post
 * screen is shown: what the account allows can change.
 */
export function useTikTokCreatorInfos(brandId: string | null, accountIds: string[]) {
  return useQueries({
    queries: accountIds.map((accountId) => ({
      queryKey: TIKTOK_QUERY_KEYS.creatorInfo(brandId, accountId),
      queryFn: () => getTikTokCreatorInfo(brandId!, accountId),
      enabled: Boolean(brandId),
      staleTime: 0,
      refetchOnWindowFocus: true,
      retry: false,
    })),
  })
}

export function useTikTokDashboard(brandId: string | null, query: TikTokQuery, enabled = true) {
  return useQuery({
    queryKey: TIKTOK_QUERY_KEYS.dashboard(brandId, query),
    queryFn: () => getTikTokDashboard(brandId!, query),
    enabled: Boolean(brandId) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useTikTokVideos(brandId: string | null, query: TikTokVideosQuery) {
  return useQuery({
    queryKey: TIKTOK_QUERY_KEYS.videos(brandId, query),
    queryFn: () => getTikTokVideos(brandId!, query),
    enabled: Boolean(brandId),
    placeholderData: keepPreviousData,
  })
}

export function useTikTokVideo(brandId: string | null, videoId: string | null) {
  return useQuery({
    queryKey: TIKTOK_QUERY_KEYS.video(brandId, videoId),
    queryFn: () => getTikTokVideo(brandId!, videoId!),
    enabled: Boolean(brandId && videoId),
  })
}

export function useConnectTikTok() {
  return useMutation({
    mutationFn: async (brandId: string) => {
      const popup = window.open(
        'about:blank',
        'socialops-tiktok-oauth',
        'popup=yes,width=720,height=760',
      )
      try {
        const result = await startTikTokConnect(brandId)
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

export function useDisconnectTikTokAccount(brandId: string | null) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (accountId: string) => disconnectTikTokAccount(brandId!, accountId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: TIKTOK_QUERY_KEYS.root(brandId) }),
        client.invalidateQueries({ queryKey: SOCIAL_ACCOUNT_QUERY_KEYS.counts(brandId) }),
      ])
    },
  })
}

export function useRefreshTikTok(brandId: string | null) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (accountId?: string) => refreshTikTok(brandId!, accountId),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: TIKTOK_QUERY_KEYS.integration(brandId) })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SOCIAL_ACCOUNT_QUERY_KEYS } from '@/features/social-accounts'
import {
  disconnectTikTok,
  getTikTokCreatorInfo,
  getTikTokIntegration,
  startTikTokConnect,
} from './service'

export const TIKTOK_QUERY_KEYS = {
  root: (brandId: string | null) => ['tiktok', brandId] as const,
  integration: (brandId: string | null) => ['tiktok', brandId, 'integration'] as const,
  creatorInfo: (brandId: string | null, accountId: string | null) =>
    ['tiktok', brandId, 'creator-info', accountId] as const,
}

export function useTikTokIntegration(brandId: string | null) {
  return useQuery({
    queryKey: TIKTOK_QUERY_KEYS.integration(brandId),
    queryFn: () => getTikTokIntegration(brandId!),
    enabled: Boolean(brandId),
  })
}

export function useTikTokCreatorInfo(brandId: string | null, accountId: string | null) {
  return useQuery({
    queryKey: TIKTOK_QUERY_KEYS.creatorInfo(brandId, accountId),
    queryFn: () => getTikTokCreatorInfo(brandId!, accountId!),
    enabled: Boolean(brandId && accountId),
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

export function useDisconnectTikTok(brandId: string | null) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => disconnectTikTok(brandId!),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: TIKTOK_QUERY_KEYS.root(brandId) }),
        client.invalidateQueries({ queryKey: SOCIAL_ACCOUNT_QUERY_KEYS.counts(brandId) }),
      ])
    },
  })
}

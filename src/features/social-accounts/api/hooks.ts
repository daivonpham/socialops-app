import { useQuery } from '@tanstack/react-query'
import { getSocialAccountCounts } from './service'

export const SOCIAL_ACCOUNT_QUERY_KEYS = {
  // Brand-scoped data ⇒ brandId is part of the key, so switching brand is a
  // different cache entry — no manual invalidation needed.
  counts: (brandId: string | null) => ['social-accounts', 'counts', brandId] as const,
}

export function useSocialAccountCounts(brandId: string | null) {
  return useQuery({
    queryKey: SOCIAL_ACCOUNT_QUERY_KEYS.counts(brandId),
    queryFn: () => getSocialAccountCounts(brandId!),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

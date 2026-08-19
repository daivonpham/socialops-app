import { useQuery } from '@tanstack/react-query'
import { getBrand, getBrands } from './service'

export const BRAND_QUERY_KEYS = {
  list: (workspaceId: string | null) => ['brands', 'list', workspaceId] as const,
  detail: (brandId: string | null) => ['brands', 'detail', brandId] as const,
}

export function useBrands(workspaceId: string | null) {
  return useQuery({
    queryKey: BRAND_QUERY_KEYS.list(workspaceId),
    queryFn: () => getBrands(workspaceId!),
    enabled: workspaceId !== null,
    select: (response) => response.data,
  })
}

/** Brand detail includes the current user's permission keys for that brand. */
export function useBrand(brandId: string | null) {
  return useQuery({
    queryKey: BRAND_QUERY_KEYS.detail(brandId),
    queryFn: () => getBrand(brandId!),
    enabled: brandId !== null,
    select: (response) => response.data,
  })
}

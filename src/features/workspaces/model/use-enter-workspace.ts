import { useQueryClient } from '@tanstack/react-query'
import { BRAND_QUERY_KEYS, getBrands } from '@/features/brands'
import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'

/** Switches to a Workspace the user just joined, opening its first visible Brand if any. */
export function useEnterWorkspace() {
  const queryClient = useQueryClient()
  const { setWorkspace } = useActiveWorkspace()
  const { selectBrand } = useActiveBrand()

  return async (workspaceId: string) => {
    const brands = await queryClient.fetchQuery({
      queryKey: BRAND_QUERY_KEYS.list(workspaceId),
      queryFn: () => getBrands(workspaceId),
    })
    const firstBrand = brands.data[0]
    if (firstBrand) selectBrand(workspaceId, firstBrand.id)
    else setWorkspace(workspaceId)
  }
}

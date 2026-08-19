import { useMemo, type ReactNode } from 'react'
import { useBrand } from '@/features/brands'
import { PermissionsContext, type PermissionsContextValue } from '@/shared/permissions'
import { useActiveBrand } from '@/shared/scope'

/**
 * Supplies the granted permission keys of the ACTIVE Brand. The backend
 * returns grants scoped per Brand (on the brand detail response); changing
 * the active Brand changes the query key, so grants are re-read and the
 * previous Brand's keys are never reused or merged. Client checks are UX
 * only — the server re-authorizes every request.
 */
export function PermissionProvider({ children }: { children: ReactNode }) {
  const { brandId } = useActiveBrand()
  const { data: brand, isPending } = useBrand(brandId)

  const value = useMemo<PermissionsContextValue>(
    () => ({
      granted: brand?.permissions ?? [],
      // A disabled query stays "pending" forever — only report loading when a brand is active.
      isLoading: brandId !== null && isPending,
    }),
    [brand, brandId, isPending],
  )

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}

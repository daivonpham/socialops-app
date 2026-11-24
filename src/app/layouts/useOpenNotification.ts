import { useQueryClient } from '@tanstack/react-query'
import { generatePath, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/router/paths'
import { BRAND_QUERY_KEYS, getBrands } from '@/features/brands'
import type { NotificationOpen } from '@/features/notifications'
import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'

/**
 * Where a notification leads: into its Workspace and Brand, then the screen. A Brand the person
 * can no longer open is swapped for the first one they can, and its post or chat is not opened,
 * so the app never lands in a Brand or on a post it cannot show.
 */
export function useOpenNotification() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { selectBrand } = useActiveBrand()
  const { setWorkspace } = useActiveWorkspace()

  /** Enters the Workspace and Brand; true when the person is now in that very Brand. */
  const enter = async (workspaceId: string, brandId: string | null): Promise<boolean> => {
    try {
      const brands = await queryClient.fetchQuery({
        queryKey: BRAND_QUERY_KEYS.list(workspaceId),
        queryFn: () => getBrands(workspaceId),
      })
      const brand = brands.data.find((item) => item.id === brandId) ?? brands.data[0]
      if (brand) selectBrand(workspaceId, brand.id)
      else setWorkspace(workspaceId)
      return !brandId || brand?.id === brandId
    } catch {
      return false
    }
  }

  return async ({ target, workspaceId, brandId }: NotificationOpen): Promise<void> => {
    const inBrand = workspaceId ? await enter(workspaceId, brandId) : true
    if (target.kind === 'planning') {
      const path = generatePath(ROUTES.PLATFORM_PLANNING, { platform: target.platform })
      const search = !inBrand
        ? ''
        : target.contentId
          ? `?content=${target.contentId}`
          : target.chatId
            ? `?aiChat=${target.chatId}`
            : ''
      navigate(path + search)
    } else if (target.kind === 'channels') {
      navigate(generatePath(ROUTES.PLATFORM_OVERVIEW, { platform: target.platform }))
    } else if (target.kind === 'members') {
      navigate(ROUTES.MEMBERS)
    }
  }
}

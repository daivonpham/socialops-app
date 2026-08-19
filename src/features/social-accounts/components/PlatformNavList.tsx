import type { ReactNode } from 'react'
import { useActiveBrand } from '@/shared/scope'
import { Badge, Button, IconFacebook, IconTikTok, NavItem, Spin, Tooltip } from '@/shared/ui'
import { useSocialAccountCounts } from '../api'
import { PLATFORMS, type Platform } from '../api/types'

export const PLATFORM_LABEL: Record<Platform, string> = {
  facebook: 'Facebook',
  tiktok: 'TikTok',
}

// Platform colors are contextual identifiers only (design.md §3.6) — icon-sized, never surfaces.
const PLATFORM_ICON: Record<Platform, ReactNode> = {
  facebook: <IconFacebook className="text-platform-facebook" />,
  tiktok: <IconTikTok className="text-platform-tiktok" />,
}

/**
 * Data-driven nav section: the platform list with counts is Brand-scoped DATA
 * from this feature, not route/menu config. The layout passes `getHref` so the
 * feature never hard-codes app paths.
 */
export function PlatformNavList({ getHref }: { getHref: (platform: Platform) => string }) {
  const { brandId } = useActiveBrand()
  const { data: counts, isPending, isError, isFetching, refetch } = useSocialAccountCounts(brandId)

  if (isPending) {
    return (
      <div className="px-3 py-2">
        <Spin size="sm" />
      </div>
    )
  }

  if (isError || !counts) {
    // design.md §21.5 — say what failed and offer a way out, not just a dead message.
    return (
      <div className="px-3 py-2">
        <p className="text-body-sm text-text-secondary">
          Couldn't load connected platforms for this brand.
        </p>
        <Button variant="link" size="sm" loading={isFetching} onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      {PLATFORMS.map((platform) => (
        <NavItem
          key={platform}
          to={getHref(platform)}
          icon={PLATFORM_ICON[platform]}
          label={PLATFORM_LABEL[platform]}
          badge={
            <Tooltip title={`${counts[platform]} connected ${PLATFORM_LABEL[platform]} accounts`}>
              <Badge count={counts[platform]} />
            </Tooltip>
          }
        />
      ))}
    </>
  )
}

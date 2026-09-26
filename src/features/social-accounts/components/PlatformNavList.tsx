import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, resolveLocale } from '@/shared/i18n'
import { useActiveBrand } from '@/shared/scope'
import { Badge, Button, IconFacebook, IconTikTok, NavItem, Spin, Tooltip } from '@/shared/ui'
import { useSocialAccountCounts } from '../api'
import { PLATFORMS, type Platform } from '../api/types'

export const PLATFORM_LABEL_KEY = {
  facebook: 'platforms.facebook',
  tiktok: 'platforms.tiktok',
} as const satisfies Record<Platform, string>

// Platform colors are contextual identifiers only (design.md §3.6) — icon-sized, never surfaces.
const PLATFORM_NAV: Record<Platform, { icon: ReactNode; activeIcon?: ReactNode }> = {
  facebook: {
    icon: (
      <IconFacebook className="text-platform-facebook transition-colors group-hover:text-text-inverse" />
    ),
    activeIcon: <IconFacebook className="text-text-inverse" />,
  },
  tiktok: {
    icon: (
      <IconTikTok className="text-text-primary transition-colors group-hover:text-text-inverse" />
    ),
    activeIcon: <IconTikTok className="text-text-inverse" />,
  },
}

/**
 * Data-driven nav section: the platform list with counts is Brand-scoped DATA
 * from this feature, not route/menu config. The layout passes `getHref` so the
 * feature never hard-codes app paths.
 */
export function PlatformNavList({
  getHref,
  collapsed = false,
}: {
  getHref: (platform: Platform) => string
  collapsed?: boolean
}) {
  const { t, i18n } = useTranslation('socialAccounts')
  const { brandId } = useActiveBrand()
  const { data: counts, isPending, isError, isFetching, refetch } = useSocialAccountCounts(brandId)

  if (brandId !== null && isPending) {
    return (
      <div className="px-3 py-2">
        <Spin size="sm" />
      </div>
    )
  }

  if (brandId !== null && (isError || !counts)) {
    // design.md §21.5 — say what failed and offer a way out, not just a dead message.
    return (
      <div className="px-3 py-2">
        <p className="text-body-sm text-text-secondary">{t('navigation.loadError')}</p>
        <Button variant="link" size="sm" loading={isFetching} onClick={() => void refetch()}>
          {t('navigation.retry')}
        </Button>
      </div>
    )
  }

  const resolvedCounts = counts ?? { facebook: 0, tiktok: 0 }

  return (
    <>
      {PLATFORMS.map((platform) => {
        const platformLabel = t(PLATFORM_LABEL_KEY[platform])
        const count = resolvedCounts[platform]
        const formattedCount = formatNumber(
          count,
          resolveLocale(i18n.resolvedLanguage ?? i18n.language),
        )
        return (
          <NavItem
            key={platform}
            to={getHref(platform)}
            icon={PLATFORM_NAV[platform].icon}
            activeIcon={PLATFORM_NAV[platform].activeIcon}
            activeClassName="bg-action-primary text-text-inverse hover:bg-action-primary-hover hover:text-text-inverse"
            collapsed={collapsed}
            tone="primary"
            label={platformLabel}
            badge={
              collapsed ? null : (
                <Tooltip
                  title={t('navigation.connectedAccounts', {
                    count,
                    formattedCount,
                    platform: platformLabel,
                  })}
                >
                  <Badge count={formattedCount} />
                </Tooltip>
              )
            }
          />
        )
      })}
    </>
  )
}

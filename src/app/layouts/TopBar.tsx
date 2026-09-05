import { generatePath, Link, useMatch } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/router/paths'
import { getNavEntries } from '@/app/router/routes'
import { BrandSwitcher } from '@/features/brands'
import { PLATFORMS } from '@/features/social-accounts'
import { WorkspaceSwitcher } from '@/features/workspaces'
import { normalizeLocale, resolveLocale, SUPPORTED_LOCALES, type AppLocale } from '@/shared/i18n'
import {
  Avatar,
  Button,
  Dropdown,
  IconMenu,
  IconProfile,
  IconSignOut,
  Logo,
  NavItem,
} from '@/shared/ui'

const topNav = getNavEntries('top')

/**
 * Chrome only — zero API calls. Data-driven parts (workspace/brand switchers)
 * are feature components composed in. Height derives from compact tokens: 32px
 * controls + 8px vertical padding (design.md defines no explicit top bar height);
 * horizontal padding follows the page gutters of §6.1.
 */
export function TopBar({
  onOpenSidebar,
  desktopSidebarExpanded = true,
  onPreviewOpen,
  onPreviewClose,
}: {
  onOpenSidebar?: () => void
  desktopSidebarExpanded?: boolean
  onPreviewOpen?: () => void
  onPreviewClose?: () => void
}) {
  const { t } = useTranslation('app')
  const overviewMatch = useMatch(ROUTES.PLATFORM_OVERVIEW)
  const planningMatch = useMatch(ROUTES.PLATFORM_PLANNING)
  const platformParam = overviewMatch?.params.platform ?? planningMatch?.params.platform
  const activePlatform = PLATFORMS.find((platform) => platform === platformParam)

  return (
    <header className="flex shrink-0 items-stretch border-b border-border-subtle bg-bg-surface">
      {/* Same width + right border as the sidebar so the rail reads as one column. */}
      <div
        className={
          'flex min-w-0 items-center gap-2 px-3 py-2 md:shrink-0 md:border-e md:border-border-subtle md:transition-[width] md:duration-drawer md:ease-standard ' +
          (desktopSidebarExpanded ? 'md:w-sidebar' : 'md:w-sidebar-collapsed md:justify-center')
        }
        onMouseEnter={onPreviewOpen}
        onMouseLeave={onPreviewClose}
      >
        {onOpenSidebar ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('topbar.openNavigation')}
            className="md:hidden"
            onClick={onOpenSidebar}
          >
            <span className="flex items-center">
              <IconMenu aria-hidden className="text-icon-md text-text-secondary" />
            </span>
          </Button>
        ) : null}
        <Link
          to={ROUTES.ROOT}
          aria-label={t('topbar.home')}
          className="shrink-0 rounded-sm outline-none focus-visible:focus-ring"
        >
          <Logo size="sm" />
        </Link>
        <div className={desktopSidebarExpanded ? 'hidden min-w-0 flex-1 md:block' : 'hidden'}>
          <WorkspaceSwitcher />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2 md:gap-3 md:px-5">
        <div className="hidden min-w-0 md:block">
          <BrandSwitcher />
        </div>
        <div className="flex-1" />
        <nav
          aria-label={t('topbar.primaryNavigation')}
          className="hidden items-center gap-1 lg:flex"
        >
          {topNav.map((entry) =>
            activePlatform ? (
              <NavItem
                key={entry.path}
                to={generatePath(entry.path, { platform: activePlatform })}
                label={t(entry.labelKey)}
              />
            ) : (
              <span
                key={entry.path}
                aria-disabled="true"
                className="flex h-10 cursor-not-allowed items-center rounded-lg px-3 text-label-md text-text-disabled"
              >
                {t(entry.labelKey)}
              </span>
            ),
          )}
        </nav>
        <AccountMenu />
      </div>
    </header>
  )
}

/** Static chrome until an auth feature exists — no user endpoint is mocked on purpose. */
function AccountMenu() {
  const { t, i18n } = useTranslation('app')
  const { t: tCommon } = useTranslation('common')
  const locale = resolveLocale(i18n.resolvedLanguage ?? i18n.language)

  return (
    <Dropdown
      placement="bottomRight"
      selectedKey={locale}
      onSelect={(key) => {
        const nextLocale = normalizeLocale(key)
        if (nextLocale && nextLocale !== locale) void i18n.changeLanguage(nextLocale)
      }}
      items={[
        { key: 'profile', label: t('account.profile'), icon: <IconProfile /> },
        { type: 'divider' },
        ...SUPPORTED_LOCALES.map((option) => ({
          key: option,
          label: t('account.languageOption', { language: localeDisplayName(option, tCommon) }),
        })),
        { type: 'divider' },
        { key: 'sign-out', label: t('account.signOut'), icon: <IconSignOut />, danger: true },
      ]}
    >
      {/* The avatar renders initials, so this is not an icon-only button and
          §11 does not ask for a tooltip — and one here would sit on top of the
          very menu it opens (tooltip 700 > dropdown 500, design.md §10). */}
      <button
        type="button"
        aria-label={t('account.menu')}
        className="rounded-full outline-none focus-visible:focus-ring"
      >
        <Avatar name="Alex Nguyen" size="sm" />
      </button>
    </Dropdown>
  )
}

function localeDisplayName(locale: AppLocale, t: ReturnType<typeof useTranslation<'common'>>['t']) {
  return locale === 'en-US' ? t('locales.enUS') : t('locales.viVN')
}

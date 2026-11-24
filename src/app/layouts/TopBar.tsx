import { generatePath, Link, useMatch, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/router/paths'
import { getNavEntries } from '@/app/router/routes'
import { BrandSwitcher } from '@/features/brands'
import { PLATFORMS } from '@/features/social-accounts'
import { NotificationsBell } from '@/features/notifications'
import { WorkspaceSwitcher } from '@/features/workspaces'
import {
  Avatar,
  Button,
  Dropdown,
  IconMenu,
  IconProfile,
  IconSignOut,
  Logo,
  NavItem,
  TopLoadingBar,
  useLocaleMenu,
} from '@/shared/ui'
import { useAuth } from '@/shared/auth'
import { useOpenNotification } from './useOpenNotification'

const topNav = getNavEntries('top')

/**
 * Chrome only — zero API calls. Data-driven parts (workspace/brand switchers, notification bell)
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
  const planningMatch = useMatch({ path: ROUTES.PLATFORM_PLANNING, end: false })
  const platformParam = overviewMatch?.params.platform ?? planningMatch?.params.platform
  const activePlatform = PLATFORMS.find((platform) => platform === platformParam)

  const platformNav = topNav.map((entry) =>
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
  )

  return (
    <>
      <header className="relative flex shrink-0 items-stretch border-b border-border-subtle bg-bg-surface">
        {/* Same width + right border as the sidebar so the rail reads as one column. */}
        <div
          className={
            'flex min-w-0 items-center gap-2 px-3 py-2 lg:shrink-0 lg:border-e lg:border-border-subtle lg:transition-[width] lg:duration-drawer lg:ease-standard ' +
            (desktopSidebarExpanded ? 'lg:w-sidebar' : 'lg:w-sidebar-collapsed lg:justify-center')
          }
          onMouseEnter={onPreviewOpen}
          onMouseLeave={onPreviewClose}
        >
          {onOpenSidebar ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('topbar.openNavigation')}
              className="lg:hidden"
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
          <div className={desktopSidebarExpanded ? 'hidden min-w-0 flex-1 lg:block' : 'hidden'}>
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
            {platformNav}
          </nav>
          <NotificationBell />
          <AccountMenu />
        </div>
        <TopLoadingBar label={t('topbar.loading')} />
      </header>
      {/* Below 1024px there is no room in the bar: a platform's Overview and Planning get their own
        row, so they can still be reached. */}
      {activePlatform ? (
        <nav
          aria-label={t('topbar.primaryNavigation')}
          className="flex shrink-0 items-center gap-1 border-b border-border-subtle bg-bg-surface px-4 py-1 md:px-5 lg:hidden"
        >
          {platformNav}
        </nav>
      ) : null}
    </>
  )
}

function NotificationBell() {
  const open = useOpenNotification()
  return <NotificationsBell onOpen={(value) => void open(value)} />
}

function AccountMenu() {
  const { t } = useTranslation('app')
  const { locale, items: localeItems, selectLocale } = useLocaleMenu()
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const selectItem = (key: string) => {
    if (key === 'profile') {
      navigate(ROUTES.PROFILE)
      return
    }
    if (key === 'sign-out') {
      void signOut().finally(() => navigate(ROUTES.LOGIN, { replace: true }))
      return
    }
    selectLocale(key)
  }

  return (
    <Dropdown
      placement="bottomRight"
      selectedKey={locale}
      onSelect={selectItem}
      items={[
        { key: 'profile', label: t('account.profile'), icon: <IconProfile /> },
        { type: 'divider' },
        ...localeItems,
        { type: 'divider' },
        { key: 'sign-out', label: t('account.signOut'), icon: <IconSignOut />, danger: true },
      ]}
    >
      {/* Google users render their profile image; other accounts fall back to initials. */}
      <button
        type="button"
        aria-label={t('account.menu')}
        className="rounded-full outline-none focus-visible:focus-ring"
      >
        <Avatar
          name={user?.displayName ?? user?.email ?? 'User'}
          src={user?.avatarUrl ?? undefined}
          size="sm"
        />
      </button>
    </Dropdown>
  )
}

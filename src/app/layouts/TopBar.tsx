import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/paths'
import { getNavEntries } from '@/app/router/routes'
import { BrandSwitcher } from '@/features/brands'
import { WorkspaceSwitcher } from '@/features/workspaces'
import { Avatar, Button, Dropdown, IconMenu, IconProfile, IconSignOut, Logo, NavItem } from '@/shared/ui'

const topNav = getNavEntries('top')

/**
 * Chrome only — zero API calls. Data-driven parts (workspace/brand switchers)
 * are feature components composed in. Height derives from tokens: 40px
 * controls + 12px vertical padding (design.md defines no explicit top bar height);
 * horizontal padding follows the page gutters of §6.1.
 */
export function TopBar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  return (
    <header className="flex shrink-0 items-stretch border-b border-border-subtle bg-bg-surface">
      {/* Same width + right border as the sidebar so the rail reads as one column. */}
      <div className="flex min-w-0 items-center gap-2 px-3 py-3 md:w-sidebar md:shrink-0 md:border-r md:border-border-subtle">
        {onOpenSidebar ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label="Open navigation"
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
          aria-label="SocialOps home"
          className="shrink-0 rounded-sm outline-none focus-visible:focus-ring"
        >
          <Logo size="sm" />
        </Link>
        <div className="hidden min-w-0 flex-1 md:block">
          <WorkspaceSwitcher />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 md:gap-3 md:px-6">
        <div className="hidden min-w-0 md:block">
          <BrandSwitcher />
        </div>
        <div className="flex-1" />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {topNav.map((entry) => (
            <NavItem key={entry.path} to={entry.path} label={entry.label} />
          ))}
        </nav>
        <AccountMenu />
      </div>
    </header>
  )
}

/** Static chrome until an auth feature exists — no user endpoint is mocked on purpose. */
function AccountMenu() {
  return (
    <Dropdown
      placement="bottomRight"
      items={[
        { key: 'profile', label: 'Profile', icon: <IconProfile /> },
        { type: 'divider' },
        { key: 'sign-out', label: 'Sign out', icon: <IconSignOut />, danger: true },
      ]}
    >
      {/* The avatar renders initials, so this is not an icon-only button and
          §11 does not ask for a tooltip — and one here would sit on top of the
          very menu it opens (tooltip 700 > dropdown 500, design.md §10). */}
      <button
        type="button"
        aria-label="Account menu"
        className="rounded-full outline-none focus-visible:focus-ring"
      >
        <Avatar name="Alex Nguyen" size="sm" />
      </button>
    </Dropdown>
  )
}

import { generatePath } from 'react-router-dom'
import { ROUTES } from '@/app/router/paths'
import { BrandSwitcher } from '@/features/brands'
import { getNavEntries, type NavEntry } from '@/app/router/routes'
import { PlatformNavList } from '@/features/social-accounts'
import { WorkspaceSwitcher } from '@/features/workspaces'
import { allOf, usePermissions } from '@/shared/permissions'
import { Divider, NavItem, SectionLabel, Spin } from '@/shared/ui'

const summaryNav = getNavEntries('summary')
const mainNav = getNavEntries('main')

/**
 * Chrome only — zero API calls. Static entries are derived from the route
 * tree (handle.nav / handle.requires); the platform section is Brand-scoped
 * DATA rendered by the social-accounts feature component.
 */
export function Sidebar({
  inDrawer = false,
  showScopeControls = false,
  collapsed = false,
  onPreviewOpen,
  onPreviewClose,
}: {
  inDrawer?: boolean
  showScopeControls?: boolean
  collapsed?: boolean
  onPreviewOpen?: () => void
  onPreviewClose?: () => void
}) {
  const { granted, isLoading } = usePermissions()
  const canSee = (entry: NavEntry) => !entry.requires || allOf(granted, entry.requires)

  return (
    <aside
      className={
        'flex min-h-0 flex-1 shrink-0 flex-col gap-1 overflow-x-hidden overflow-y-auto bg-bg-surface transition-[width,padding] duration-drawer ease-standard ' +
        (inDrawer
          ? 'w-full p-3'
          : collapsed
            ? 'w-sidebar-collapsed border-r border-border-subtle p-2'
            : 'w-sidebar border-r border-border-subtle p-3')
      }
      onMouseEnter={onPreviewOpen}
      onMouseLeave={onPreviewClose}
    >
      {showScopeControls ? (
        <>
          <div className="grid gap-2 pb-2">
            <WorkspaceSwitcher />
            <BrandSwitcher />
          </div>
          <Divider className="my-2" />
        </>
      ) : null}

      {collapsed ? null : <SectionLabel className="px-3 pb-1 pt-2">Summary</SectionLabel>}
      {summaryNav.filter(canSee).map((entry) => renderEntry(entry, collapsed))}

      <Divider className={collapsed ? 'my-1' : 'my-2'} />

      {collapsed ? null : <SectionLabel className="px-3 pb-1 pt-2">Platforms</SectionLabel>}
      <PlatformNavList
        collapsed={collapsed}
        getHref={(platform) => generatePath(ROUTES.PLATFORM, { platform })}
      />

      <Divider className={collapsed ? 'my-1' : 'my-2'} />

      {isLoading ? (
        <div className="px-3 py-2">
          <Spin size="sm" />
        </div>
      ) : (
        mainNav.filter(canSee).map((entry) => renderEntry(entry, collapsed))
      )}
    </aside>
  )
}

function renderEntry(entry: NavEntry, collapsed: boolean) {
  return <NavItem key={entry.path} to={entry.path} icon={entry.icon} label={entry.label} collapsed={collapsed} />
}

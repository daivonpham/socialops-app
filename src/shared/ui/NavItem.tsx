import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

export type NavItemProps = {
  to: string
  label: string
  icon?: ReactNode
  /** Shown instead of `icon` while the route is active. Falls back to `icon`. */
  activeIcon?: ReactNode
  /** Optional active-state override for special nav sections. */
  activeClassName?: string
  /** Icon-only collapsed state used by the desktop sidebar. */
  collapsed?: boolean
  /** Trailing slot, e.g. a count <Badge/>. */
  badge?: ReactNode
  end?: boolean
}

/**
 * Navigation entry for the sidebar and top bar. Kit-free on purpose: the
 * product nav style — neutral selected background, 14px/500 labels and 8px
 * radius — is simpler as a styled NavLink than as a
 * restyled antd Menu.
 */
export function NavItem({
  to,
  label,
  icon,
  activeIcon,
  activeClassName,
  collapsed = false,
  badge,
  end,
}: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        'flex h-10 items-center rounded-lg text-label-md outline-none transition-colors duration-base ease-standard focus-visible:focus-ring ' +
        (collapsed ? ' justify-center px-2' : ' gap-2 px-3') +
        ' ' +
        (isActive
          ? (activeClassName ?? 'bg-bg-surface-muted text-text-primary')
          : 'text-text-secondary hover:bg-bg-surface-muted hover:text-text-primary')
      }
    >
      {({ isActive }) => {
        const shownIcon = isActive && activeIcon ? activeIcon : icon
        return (
          <>
            {shownIcon ? (
              <span aria-hidden className="flex text-icon-md">
                {shownIcon}
              </span>
            ) : null}
            {collapsed ? null : <span className="min-w-0 flex-1 truncate">{label}</span>}
            {collapsed ? null : badge}
          </>
        )
      }}
    </NavLink>
  )
}

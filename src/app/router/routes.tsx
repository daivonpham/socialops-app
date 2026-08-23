import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import type { AppNavigationKey } from '@/app/i18n/en-US'
import { PERMISSIONS } from '@/shared/permissions'
import { IconAllPlatforms, IconMembers, IconReports, IconSettings, Spin } from '@/shared/ui'
import { ROUTES } from './paths'

export type NavSection = 'top' | 'summary' | 'main'

/**
 * Nav metadata and required access live ON the route (`handle`) — the sidebar
 * and top bar derive their entries by walking this tree, and the route guard
 * reads the same `requires`. No separate menu constants file exists.
 */
export type AppRouteHandle = {
  nav?: { labelKey: AppNavigationKey; section: NavSection; order: number; icon?: ReactNode }
  /** Access needed to enter the route — UX only, the server enforces for real. */
  requires?: readonly string[]
}

const handle = (value: AppRouteHandle) => value

// All placeholder screens share one lazy chunk; each route resolves its own
// title from the matched handle/params.
const placeholderPage = async () => ({
  Component: (await import('./PlaceholderPage')).default,
})

const layoutChildren: RouteObject[] = [
  { index: true, element: <Navigate to={ROUTES.ALL_PLATFORMS} replace /> },
  {
    path: ROUTES.ALL_PLATFORMS,
    lazy: placeholderPage,
    handle: handle({
      nav: {
        labelKey: 'navigation.allPlatforms',
        section: 'summary',
        order: 10,
        icon: <IconAllPlatforms />,
      },
    }),
  },
  // Platform pages are reached from the data-driven <PlatformNavList/>, not from route nav metadata.
  {
    path: ROUTES.FACEBOOK,
    lazy: async () => ({
      Component: (await import('@/features/facebook/pages/FacebookPage')).default,
    }),
  },
  { path: ROUTES.PLATFORM, lazy: placeholderPage },
  {
    path: ROUTES.OVERVIEW,
    lazy: placeholderPage,
    handle: handle({ nav: { labelKey: 'navigation.overview', section: 'top', order: 10 } }),
  },
  {
    path: ROUTES.PLANNING,
    lazy: placeholderPage,
    handle: handle({ nav: { labelKey: 'navigation.planning', section: 'top', order: 20 } }),
  },
  {
    path: ROUTES.REPORTS,
    lazy: placeholderPage,
    handle: handle({
      nav: { labelKey: 'navigation.reports', section: 'main', order: 10, icon: <IconReports /> },
      requires: [PERMISSIONS.REPORTS_VIEW.key],
    }),
  },
  {
    path: ROUTES.MEMBERS,
    lazy: placeholderPage,
    handle: handle({
      nav: { labelKey: 'navigation.members', section: 'main', order: 20, icon: <IconMembers /> },
      requires: [PERMISSIONS.MEMBERS_VIEW.key],
    }),
  },
  {
    path: ROUTES.SETTINGS,
    lazy: placeholderPage,
    handle: handle({
      nav: { labelKey: 'navigation.settings', section: 'main', order: 30, icon: <IconSettings /> },
      requires: [PERMISSIONS.SETTINGS_VIEW.key],
    }),
  },
  { path: '*', element: <Navigate to={ROUTES.ALL_PLATFORMS} replace /> },
]

export type NavEntry = {
  path: string
  labelKey: AppNavigationKey
  icon?: ReactNode
  order: number
  requires?: readonly string[]
}

/** Walks the route tree to build nav entries for one section (sorted by order). */
export function getNavEntries(section: NavSection): NavEntry[] {
  return layoutChildren
    .flatMap((route) => {
      const routeHandle = route.handle as AppRouteHandle | undefined
      if (!route.path || !routeHandle?.nav || routeHandle.nav.section !== section) return []
      const { labelKey, icon, order } = routeHandle.nav
      return [{ path: route.path, labelKey, icon, order, requires: routeHandle.requires }]
    })
    .sort((a, b) => a.order - b.order)
}

const bootFallback = (
  <div className="flex h-screen items-center justify-center bg-bg-page">
    <Spin size="lg" />
  </div>
)

export const router = createBrowserRouter([
  {
    path: ROUTES.SELECT_BRAND,
    lazy: async () => ({
      Component: (await import('@/features/brands/pages/BrandPickerPage')).default,
    }),
    hydrateFallbackElement: bootFallback,
  },
  {
    path: ROUTES.ROOT,
    // The layout is lazy too: it keeps the entry chunk small and breaks the
    // static cycle routes → AdminLayout → Sidebar → getNavEntries (this file).
    lazy: async () => ({
      Component: (await import('@/app/layouts/AdminLayout')).default,
    }),
    hydrateFallbackElement: bootFallback,
    children: layoutChildren,
  },
])

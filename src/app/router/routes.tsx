import type { ReactNode } from 'react'
import {
  createBrowserRouter,
  generatePath,
  Navigate,
  useParams,
  type RouteObject,
} from 'react-router-dom'
import type { AppNavigationKey } from '@/app/i18n/en-US'
import { PLATFORMS } from '@/features/social-accounts'
import { PERMISSIONS } from '@/shared/permissions'
import { IconAllPlatforms, IconMembers, IconReports, IconSettings, Spin } from '@/shared/ui'
import { ROUTES } from './paths'
import { AuthBoundary } from './guards'

export type NavSection = 'top' | 'summary' | 'main'

/**
 * Nav metadata and required access live ON the route (`handle`) — the sidebar
 * and top bar derive their entries by walking this tree, and the route guard
 * reads the same `requires`. No separate menu constants file exists.
 */
export type AppRouteHandle = {
  auth?: 'public' | 'guest-only' | 'required'
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
    lazy: async () => ({
      Component: (await import('@/features/overview/pages/AllPlatformsPage')).default,
    }),
    handle: handle({
      nav: {
        labelKey: 'navigation.allPlatforms',
        section: 'summary',
        order: 10,
        icon: <IconAllPlatforms />,
      },
    }),
  },
  // A platform and a function are two independent navigation dimensions. Their
  // combined URL is the single source of truth for both Sidebar and TopBar.
  { path: ROUTES.PLATFORM, element: <PlatformDefaultRedirect /> },
  {
    path: ROUTES.FACEBOOK_OVERVIEW,
    lazy: async () => ({
      Component: (await import('@/features/facebook/pages/FacebookPage')).default,
    }),
  },
  {
    path: ROUTES.TIKTOK_OVERVIEW,
    lazy: async () => ({ Component: (await import('@/features/tiktok/pages/TikTokPage')).default }),
  },

  {
    path: ROUTES.PLATFORM_OVERVIEW,
    lazy: placeholderPage,
    handle: handle({ nav: { labelKey: 'navigation.overview', section: 'top', order: 10 } }),
  },
  {
    path: ROUTES.PLATFORM_PLANNING,
    lazy: async () => ({
      Component: (await import('@/features/planning/pages/PlanningPage')).default,
    }),
    handle: handle({ nav: { labelKey: 'navigation.planning', section: 'top', order: 20 } }),
  },
  {
    path: ROUTES.PLATFORM_PLANNING_CREATE,
    lazy: async () => ({
      Component: (await import('@/features/planning/pages/CreatePlanningPostPage')).default,
    }),
    handle: handle({ requires: [PERMISSIONS.PUBLISHING_PUBLISH.key] }),
  },
  {
    path: ROUTES.PLATFORM_PLANNING_EDIT,
    lazy: async () => ({
      Component: (await import('@/features/planning/pages/CreatePlanningPostPage')).default,
    }),
    handle: handle({ requires: [PERMISSIONS.PUBLISHING_PUBLISH.key] }),
  },
  {
    path: ROUTES.CHANGE_PASSWORD,
    element: <Navigate to={`${ROUTES.PROFILE}?tab=password`} replace />,
  },
  {
    path: ROUTES.PROFILE,
    lazy: async () => ({
      Component: (await import('@/features/profile/pages/ProfilePage')).default,
    }),
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
    lazy: async () => ({
      Component: (await import('@/features/workspaces/pages/MembersPage')).default,
    }),
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

function PlatformDefaultRedirect() {
  const { platform } = useParams<{ platform: string }>()
  const activePlatform = PLATFORMS.find((item) => item === platform)

  return (
    <Navigate
      to={
        activePlatform
          ? generatePath(ROUTES.PLATFORM_OVERVIEW, { platform: activePlatform })
          : ROUTES.ALL_PLATFORMS
      }
      replace
    />
  )
}

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

const routes: RouteObject[] = [
  {
    path: ROUTES.LOGIN,
    handle: handle({ auth: 'guest-only' }),
    lazy: async () => ({ Component: (await import('@/features/auth')).LoginPage }),
    hydrateFallbackElement: bootFallback,
  },
  {
    path: ROUTES.REGISTER,
    handle: handle({ auth: 'guest-only' }),
    lazy: async () => ({ Component: (await import('@/features/auth')).RegisterPage }),
    hydrateFallbackElement: bootFallback,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    handle: handle({ auth: 'public' }),
    lazy: async () => ({
      Component: (await import('@/features/auth/pages/ForgotPasswordPage')).default,
    }),
  },
  {
    path: ROUTES.RESET_PASSWORD,
    handle: handle({ auth: 'public' }),
    lazy: async () => ({
      Component: (await import('@/features/auth/pages/ResetPasswordPage')).default,
    }),
  },
  {
    path: ROUTES.VERIFY_EMAIL,
    handle: handle({ auth: 'public' }),
    lazy: async () => ({
      Component: (await import('@/features/auth/pages/VerifyEmailPage')).default,
    }),
  },
  {
    // Public: shows the invitation before sign-in; the page restores any existing session.
    path: ROUTES.INVITATION,
    handle: handle({ auth: 'public' }),
    lazy: async () => ({
      Component: (await import('@/features/workspaces/pages/InvitationAcceptPage')).default,
    }),
    hydrateFallbackElement: bootFallback,
  },
  {
    path: ROUTES.FACEBOOK_DATA_DELETION,
    handle: handle({ auth: 'public' }),
    lazy: async () => ({
      Component: (await import('@/features/privacy/pages/FacebookDataDeletionPage')).default,
    }),
    hydrateFallbackElement: bootFallback,
  },
  {
    path: ROUTES.GOOGLE_CALLBACK,
    handle: handle({ auth: 'required' }),
    lazy: async () => ({
      Component: (await import('@/features/auth/pages/GoogleCallbackPage')).default,
    }),
  },
  {
    path: ROUTES.FACEBOOK_CALLBACK,
    handle: handle({ auth: 'required' }),
    lazy: async () => ({
      Component: (await import('@/features/facebook/pages/FacebookCallbackPage')).default,
    }),
    hydrateFallbackElement: bootFallback,
  },
  {
    path: ROUTES.TIKTOK_CALLBACK,
    handle: handle({ auth: 'required' }),
    lazy: async () => ({
      Component: (await import('@/features/tiktok/pages/TikTokCallbackPage')).default,
    }),
    hydrateFallbackElement: bootFallback,
  },
  {
    path: ROUTES.ROOT,
    handle: handle({ auth: 'required' }),
    // The layout is lazy too: it keeps the entry chunk small and breaks the
    // static cycle routes → AdminLayout → Sidebar → getNavEntries (this file).
    lazy: async () => {
      return { Component: (await import('@/app/layouts/AdminLayout')).default }
    },
    hydrateFallbackElement: bootFallback,
    children: layoutChildren,
  },
]

export const router = createBrowserRouter([{ element: <AuthBoundary />, children: routes }])

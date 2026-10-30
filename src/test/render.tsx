import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import { AuthContext, type AuthContextValue, type AuthUser } from '@/shared/auth'
import { ScopeContext, type ScopeContextValue } from '@/shared/scope'
import { ToastProvider } from '@/shared/ui'

export const testUser: AuthUser = {
  id: 'user-1',
  email: 'invitee@example.test',
  displayName: 'Invitee',
  locale: 'en',
  avatarUrl: null,
  brandOnboardingCompleted: true,
  hasPassword: true,
}

export function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'authenticated',
    user: testUser,
    authenticate: () => {},
    restore: () => Promise.resolve(),
    updateUser: () => {},
    signOut: () => Promise.resolve(),
    ...overrides,
  }
}

export function scopeValue(overrides: Partial<ScopeContextValue> = {}): ScopeContextValue {
  return {
    workspaceId: null,
    brandId: null,
    setWorkspace: () => {},
    selectBrand: () => {},
    ...overrides,
  }
}

/** Renders routes inside the providers features rely on, with a fresh query cache. */
export function renderRoutes(
  routes: RouteObject[],
  options: { initialPath?: string; auth?: AuthContextValue; scope?: ScopeContextValue } = {},
): RenderResult & { router: ReturnType<typeof createMemoryRouter> } {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: [options.initialPath ?? '/'] })
  const wrap = (children: ReactNode) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={options.auth ?? authValue()}>
        <ScopeContext.Provider value={options.scope ?? scopeValue()}>
          <ToastProvider>{children}</ToastProvider>
        </ScopeContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  )
  return { ...render(wrap(<RouterProvider router={router} />)), router }
}

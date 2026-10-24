import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { rememberPendingInvitation } from '@/features/auth'
import { authValue, renderRoutes } from '@/test/render'
import { AuthBoundary } from './guards'
import type { AppRouteHandle } from './routes'

const routes = [
  {
    element: <AuthBoundary />,
    children: [
      {
        path: '/auth/login',
        handle: { auth: 'guest-only' } satisfies AppRouteHandle,
        element: <p>login page</p>,
      },
      { path: '/invitations/accept', element: <p>invitation page</p> },
      { path: '/', element: <p>home</p> },
    ],
  },
]

describe('AuthBoundary after sign-in', () => {
  it('continues to a pending invitation instead of the home page', async () => {
    rememberPendingInvitation('tok')
    const { router } = renderRoutes(routes, { initialPath: '/auth/login' })
    expect(await screen.findByText('invitation page')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?token=tok')
  })

  it('goes home when no invitation is waiting', async () => {
    renderRoutes(routes, { initialPath: '/auth/login' })
    expect(await screen.findByText('home')).toBeInTheDocument()
  })

  it('keeps anonymous visitors on the sign-in page', async () => {
    rememberPendingInvitation('tok')
    renderRoutes(routes, {
      initialPath: '/auth/login',
      auth: authValue({ status: 'anonymous', user: null }),
    })
    expect(await screen.findByText('login page')).toBeInTheDocument()
  })
})

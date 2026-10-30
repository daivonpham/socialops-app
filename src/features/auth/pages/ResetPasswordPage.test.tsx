import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { authValue, renderRoutes } from '@/test/render'
import { server } from '@/test/server'
import { AUTH_ROUTES } from '../config/auth.routes'
import ResetPasswordPage from './ResetPasswordPage'

function renderPage() {
  return renderRoutes(
    [
      { path: '/', element: <ResetPasswordPage /> },
      { path: AUTH_ROUTES.LOGIN, element: <p>Login page</p> },
    ],
    {
      initialPath: '/?token=reset-token',
      auth: authValue({ status: 'anonymous', user: null }),
    },
  )
}

describe('ResetPasswordPage', () => {
  it('shows the app’s own messages for a short or mismatched password', async () => {
    renderPage()

    await userEvent.type(screen.getByLabelText('New password'), 'short')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'different')
    await userEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    expect(
      await screen.findByText('Password must contain at least 8 characters.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  })

  it('submits the token, confirms with a toast and opens sign-in', async () => {
    const bodies: unknown[] = []
    server.use(
      http.post('*/api/auth/reset-password', async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ data: { message: 'Password reset' } })
      }),
    )
    renderPage()

    await userEvent.type(screen.getByLabelText('New password'), 'Sup3r-secret-password')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'Sup3r-secret-password')
    await userEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    expect(await screen.findByText('Login page')).toBeInTheDocument()
    expect(
      screen.getByText('Your password has been reset. You can now sign in.'),
    ).toBeInTheDocument()
    expect(bodies).toEqual([{ token: 'reset-token', password: 'Sup3r-secret-password' }])
  })
})

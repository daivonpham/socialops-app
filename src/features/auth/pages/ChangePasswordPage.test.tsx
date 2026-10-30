import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { authValue, renderRoutes, testUser } from '@/test/render'
import { server } from '@/test/server'
import ChangePasswordPage from './ChangePasswordPage'

function renderPage(hasPassword: boolean, email = testUser.email) {
  return renderRoutes([{ path: '/', element: <ChangePasswordPage embedded /> }], {
    auth: authValue({ user: { ...testUser, email, hasPassword } }),
  })
}

describe('ChangePasswordPage', () => {
  it('asks for the current password when the account has one', () => {
    renderPage(true)

    expect(screen.getByLabelText('Current password')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send password link' })).not.toBeInTheDocument()
  })

  it('emails a set-password link to Google-only accounts', async () => {
    const sentTo: string[] = []
    server.use(
      http.post('*/api/auth/forgot-password', async ({ request }) => {
        sentTo.push(((await request.json()) as { email: string }).email)
        return HttpResponse.json({ data: { message: 'sent' } }, { status: 202 })
      }),
    )
    renderPage(false)

    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Send password link' }))

    expect(await screen.findByText(`Link sent to ${testUser.email}`)).toBeInTheDocument()
    expect(sentTo).toEqual([testUser.email])
  })

  it('offers to open a known webmail inbox from the toast', async () => {
    server.use(
      http.post('*/api/auth/forgot-password', () =>
        HttpResponse.json({ data: { message: 'sent' } }, { status: 202 }),
      ),
    )
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    renderPage(false, 'owner@gmail.com')

    await userEvent.click(screen.getByRole('button', { name: 'Send password link' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Open email' }))

    expect(open).toHaveBeenCalledWith('https://mail.google.com/', '_blank', 'noopener,noreferrer')
    open.mockRestore()
  })
})

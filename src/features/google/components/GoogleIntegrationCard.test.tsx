import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderRoutes } from '@/test/render'
import { server } from '@/test/server'
import { GoogleIntegrationCard } from './GoogleIntegrationCard'

const routes = [{ path: '/', element: <GoogleIntegrationCard /> }]

function connection(body: object) {
  return http.get('*/api/users/me/integrations/google', () => HttpResponse.json({ data: body }))
}

describe('GoogleIntegrationCard', () => {
  it('offers to connect when no Google account is linked', async () => {
    server.use(connection({ connected: false, usable: false, email: null, connectedAt: null }))
    renderRoutes(routes)
    expect(await screen.findByText('No Google account connected yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect Google' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Disconnect' })).not.toBeInTheDocument()
  })

  it('asks to connect again once Google revoked the grant', async () => {
    server.use(
      connection({
        connected: true,
        usable: false,
        email: 'marketer@gmail.test',
        connectedAt: '2026-10-25T00:00:00Z',
      }),
    )
    renderRoutes(routes)
    expect(await screen.findByText('Connected as marketer@gmail.test')).toBeInTheDocument()
    expect(screen.getByText(/Google access was revoked or expired/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect again' })).toBeInTheDocument()
  })

  it('disconnects after confirmation', async () => {
    let connected = true
    server.use(
      http.get('*/api/users/me/integrations/google', () =>
        HttpResponse.json({
          data: connected
            ? { connected, usable: true, email: 'marketer@gmail.test', connectedAt: null }
            : { connected, usable: false, email: null, connectedAt: null },
        }),
      ),
      http.delete('*/api/users/me/integrations/google', () => {
        connected = false
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderRoutes(routes)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Disconnect' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Disconnect' }))
    expect(await screen.findByText('Google account disconnected.')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('No Google account connected yet.')).toBeInTheDocument(),
    )
  })
})

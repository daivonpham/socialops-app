import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderRoutes } from '@/test/render'
import { server } from '@/test/server'
import FacebookDataDeletionPage from './FacebookDataDeletionPage'

const routes = [{ path: '/facebook/data-deletion', element: <FacebookDataDeletionPage /> }]

describe('FacebookDataDeletionPage', () => {
  it('confirms a completed deletion with its code', async () => {
    server.use(
      http.get('*/api/social-accounts/facebook/data-deletion/:code', ({ params }) =>
        HttpResponse.json({
          data: {
            confirmationCode: params.code,
            status: 'COMPLETED',
            requestedAt: '2026-10-24T08:00:00.000Z',
            completedAt: '2026-10-24T08:00:01.000Z',
          },
        }),
      ),
    )
    renderRoutes(routes, { initialPath: '/facebook/data-deletion?code=abc123' })
    expect(await screen.findByText('Your Facebook data was deleted')).toBeInTheDocument()
    expect(screen.getByText('abc123')).toBeInTheDocument()
  })

  it('explains an unknown or missing confirmation code', async () => {
    server.use(
      http.get('*/api/social-accounts/facebook/data-deletion/:code', () =>
        HttpResponse.json({ error: { code: 'RESOURCE_NOT_FOUND' } }, { status: 404 }),
      ),
    )
    renderRoutes(routes, { initialPath: '/facebook/data-deletion?code=missing' })
    expect(await screen.findByText('Request not found')).toBeInTheDocument()

    renderRoutes(routes, { initialPath: '/facebook/data-deletion' })
    expect(await screen.findAllByText('Request not found')).toHaveLength(2)
  })
})

import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoutes } from '@/test/render'
import { server } from '@/test/server'
import type { AppNotification } from '../api'
import { NotificationsBell, type NotificationOpen } from './NotificationsBell'

const now = new Date().toISOString()
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

const approval: AppNotification = {
  id: 'n-approval',
  type: 'approval.requested',
  workspaceId: 'ws-1',
  brandId: 'brand-1',
  data: {
    contentId: 'content-1',
    platform: 'tiktok',
    caption: 'New cold brew',
    actorName: 'Lan',
    workspaceName: 'North Agency',
    brandName: 'Cafe',
  },
  read: false,
  needsAction: true,
  createdAt: now,
}

const facebook: AppNotification = {
  id: 'n-facebook',
  type: 'channel.reconnect',
  workspaceId: 'ws-1',
  brandId: 'brand-1',
  data: {
    provider: 'facebook',
    workspaceName: 'North Agency',
    brandName: 'Cafe',
    accounts: [
      { id: 'page-1', name: 'Cafe Page' },
      { id: 'page-2', name: 'Cafe Events' },
    ],
  },
  read: true,
  needsAction: true,
  createdAt: now,
}

const tiktok: AppNotification = {
  id: 'n-tiktok',
  type: 'channel.removed',
  workspaceId: 'ws-1',
  brandId: 'brand-1',
  data: { provider: 'tiktok', accounts: [{ id: 'tt-1', name: 'Cafe TikTok' }] },
  read: true,
  needsAction: true,
  createdAt: daysAgo(1),
}

const settled: AppNotification = {
  id: 'n-settled',
  type: 'publish.failed',
  workspaceId: 'ws-1',
  brandId: 'brand-1',
  data: { contentId: 'content-2', platform: 'facebook', caption: '', accountName: 'Cafe Page' },
  read: true,
  needsAction: false,
  createdAt: daysAgo(5),
}

describe('NotificationsBell', () => {
  let items: AppNotification[]
  const calls: string[] = []
  const onOpen = vi.fn<(open: NotificationOpen) => void>()

  beforeEach(() => {
    items = [approval, facebook, tiktok, settled]
    calls.length = 0
    onOpen.mockReset()
    server.use(
      http.get('*/api/notifications/unread-count', () =>
        HttpResponse.json({
          data: {
            count: items.filter((item) => !item.read).length,
            needsAction: items.filter((item) => item.needsAction).length,
          },
        }),
      ),
      http.get('*/api/notifications/stream', () => new HttpResponse(null, { status: 204 })),
      http.get('*/api/notifications', ({ request }) => {
        const action = new URL(request.url).searchParams.get('needsAction') === 'true'
        const data = action ? items.filter((item) => item.needsAction) : items
        return HttpResponse.json({
          data,
          metadata: { pagination: { page: 1, limit: 20, total: data.length, totalPage: 1 } },
        })
      }),
      http.post('*/api/notifications/:id/read', ({ params }) => {
        calls.push(`read:${String(params.id)}`)
        items = items.map((item) => (item.id === params.id ? { ...item, read: true } : item))
        return new HttpResponse(null, { status: 204 })
      }),
      http.post('*/api/notifications/read-all', () => {
        calls.push('read-all')
        items = items.map((item) => ({ ...item, read: true }))
        return new HttpResponse(null, { status: 204 })
      }),
      http.post('*/api/brands/:brandId/facebook/pages/:pageId/reconnect', ({ params }) => {
        calls.push(`fb-reconnect:${String(params.pageId)}`)
        return HttpResponse.json({ data: {} })
      }),
      http.post('*/api/brands/:brandId/social-accounts/tiktok/connect', ({ params }) => {
        calls.push(`tiktok-connect:${String(params.brandId)}`)
        return HttpResponse.json({ data: { authorizationUrl: 'https://tiktok.test/auth' } })
      }),
      http.get('*/api/invitations/mine', () => HttpResponse.json({ data: [] })),
    )
  })

  afterEach(() => vi.restoreAllMocks())

  const openBell = async () => {
    renderRoutes([{ path: '/', element: <NotificationsBell onOpen={onOpen} /> }])
    await userEvent.click(await screen.findByRole('button', { name: /^Notifications/ }))
  }

  it('shows a dot, a title and a line for each, grouped by day', async () => {
    renderRoutes([{ path: '/', element: <NotificationsBell onOpen={onOpen} /> }])
    const trigger = await screen.findByRole('button', { name: 'Notifications (1 unread)' })
    // The count lives in the label only: the bell shows a dot.
    expect(within(trigger).queryByText('1')).not.toBeInTheDocument()
    await userEvent.click(trigger)

    expect(await screen.findByText('Post waiting for review')).toBeInTheDocument()
    expect(screen.getByText('Lan: “New cold brew”')).toBeInTheDocument()
    expect(screen.getByText('Facebook needs reconnecting')).toBeInTheDocument()
    expect(screen.getByText('Cafe Page, Cafe Events')).toBeInTheDocument()
    expect(screen.getByText('Removed on TikTok')).toBeInTheDocument()
    expect(screen.getByText('Not posted to Cafe Page.')).toBeInTheDocument()
    expect(screen.getByText('1 new')).toBeInTheDocument()
    for (const group of ['Today', 'Yesterday', 'Earlier'])
      expect(screen.getByRole('region', { name: group })).toBeInTheDocument()
    // Settled: no button.
    expect(screen.queryByRole('button', { name: 'Open post' })).not.toBeInTheDocument()
  })

  it('keeps only what still waits under To do', async () => {
    await openBell()
    await userEvent.click(await screen.findByRole('tab', { name: 'To do (3)' }))
    await waitFor(() =>
      expect(screen.queryByText('Not posted to Cafe Page.')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Post waiting for review')).toBeInTheDocument()

    // Settled elsewhere: opening the bell again shows it.
    items = items.map((item) => ({ ...item, needsAction: false }))
    const trigger = screen.getByRole('button', { name: /^Notifications/ })
    await userEvent.click(trigger)
    await userEvent.click(trigger)
    expect(await screen.findByText('Nothing waits on you.')).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: 'To do' })).toBeInTheDocument()
  })

  it('opens a post to review in its Brand and marks it read', async () => {
    await openBell()
    await userEvent.click(await screen.findByRole('button', { name: 'Review' }))
    await waitFor(() => expect(calls).toContain('read:n-approval'))
    expect(onOpen).toHaveBeenCalledWith({
      target: { kind: 'planning', platform: 'tiktok', contentId: 'content-1' },
      workspaceId: 'ws-1',
      brandId: 'brand-1',
    })
  })

  it('reconnects every Facebook Page of the notification in place', async () => {
    await openBell()
    const row = (await screen.findByText('Facebook needs reconnecting')).closest('li')!
    await userEvent.click(within(row).getByRole('button', { name: 'Reconnect' }))
    await waitFor(() => expect(calls).toEqual(['fb-reconnect:page-1', 'fb-reconnect:page-2']))
    expect(await screen.findByText('Reconnected.')).toBeInTheDocument()
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('asks Facebook for a new login when a Page cannot be reconnected with the one it has', async () => {
    const popup = { location: { href: '' }, close: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    server.use(
      http.post('*/api/brands/:brandId/facebook/pages/:pageId/reconnect', () =>
        HttpResponse.json(
          { error: { code: 'FACEBOOK_TOKEN_EXPIRED', message: 'expired' } },
          { status: 409 },
        ),
      ),
      http.post('*/api/brands/:brandId/social-accounts/facebook/connect', () => {
        calls.push('fb-login')
        return HttpResponse.json({ data: { authorizationUrl: 'https://facebook.test/auth' } })
      }),
    )
    await openBell()
    const row = (await screen.findByText('Facebook needs reconnecting')).closest('li')!
    await userEvent.click(within(row).getByRole('button', { name: 'Reconnect' }))
    await waitFor(() => expect(calls).toEqual(['fb-login']))
    await waitFor(() => expect(popup.location.href).toBe('https://facebook.test/auth'))
    // Not reconnected yet: the login decides.
    expect(screen.queryByText('Reconnected.')).not.toBeInTheDocument()
  })

  it('says so when Facebook cannot be reached at all', async () => {
    vi.spyOn(window, 'open').mockReturnValue({ location: { href: '' }, close: vi.fn() } as never)
    server.use(
      http.post('*/api/brands/:brandId/facebook/pages/:pageId/reconnect', () =>
        HttpResponse.json({ error: { code: 'X', message: 'x' } }, { status: 500 }),
      ),
      http.post('*/api/brands/:brandId/social-accounts/facebook/connect', () =>
        HttpResponse.json({ error: { code: 'X', message: 'x' } }, { status: 500 }),
      ),
    )
    await openBell()
    const row = (await screen.findByText('Facebook needs reconnecting')).closest('li')!
    await userEvent.click(within(row).getByRole('button', { name: 'Reconnect' }))
    expect(
      await screen.findByText('Could not reconnect. Try again from the account manager.'),
    ).toBeInTheDocument()
  })

  it('starts a TikTok login for a removed account', async () => {
    const popup = { location: { href: '' }, close: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    await openBell()
    const row = (await screen.findByText('Removed on TikTok')).closest('li')!
    await userEvent.click(within(row).getByRole('button', { name: 'Reconnect' }))
    await waitFor(() => expect(calls).toEqual(['tiktok-connect:brand-1']))
    await waitFor(() => expect(popup.location.href).toBe('https://tiktok.test/auth'))
  })

  it('marks everything read', async () => {
    await openBell()
    await userEvent.click(await screen.findByRole('button', { name: 'Mark all as read' }))
    await waitFor(() => expect(calls).toEqual(['read-all']))
    expect(await screen.findByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('says so when there is nothing', async () => {
    items = []
    await openBell()
    expect(await screen.findByText('You are all caught up.')).toBeInTheDocument()
  })
})

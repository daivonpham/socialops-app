import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { PermissionsContext } from '@/shared/permissions'
import { renderRoutes, scopeValue } from '@/test/render'
import { server } from '@/test/server'
import type {
  TikTokAccountDto,
  TikTokDashboardDto,
  TikTokIntegrationDto,
  TikTokVideoItemDto,
} from '../api'
import TikTokPage from './TikTokPage'

const account = (id: string, name: string, extra: Partial<TikTokAccountDto> = {}) =>
  ({
    id,
    providerAccountId: `open-${id}`,
    name,
    status: 'CONNECTED',
    health: 'connected',
    isVerified: false,
    scopes: [],
    missingScopes: [],
    canUploadDrafts: true,
    refreshExpiresAt: null,
    connectedAt: '2026-11-01T00:00:00.000Z',
    sync: {
      status: 'idle',
      lastSyncedAt: '2026-11-21T08:00:00.000Z',
      historyStartAt: '2026-01-01T00:00:00.000Z',
      lastErrorCode: null,
      failureCount: 0,
    },
    ...extra,
  }) satisfies TikTokAccountDto

const kpi = (value: number, change: number | null = null) => ({
  value,
  previous: 0,
  change,
  series: [value],
})

const dashboard = (): TikTokDashboardDto => ({
  period: { since: '2026-11-21', until: '2026-11-21', days: 1, timeZone: 'Asia/Ho_Chi_Minh' },
  historyStartAt: '2026-01-01T00:00:00.000Z',
  kpis: {
    views: kpi(12_345, 25),
    likes: kpi(400),
    comments: kpi(50),
    shares: kpi(30),
    engagements: kpi(480),
    engagementRate: kpi(3.89),
    followers: kpi(1_570),
    netFollowers: kpi(70),
    videos: kpi(2),
    totalLikes: kpi(9_000),
    following: kpi(10),
  },
  trend: {
    labels: ['2026-11-21'],
    views: { current: [12_345], previous: [0] },
    engagements: { current: [480], previous: [0] },
    likes: { current: [400], previous: [0] },
    comments: { current: [50], previous: [0] },
    shares: { current: [30], previous: [0] },
  },
  interactions: { likes: 400, comments: 50, shares: 30 },
  followers: { labels: ['2026-11-21'], net: [70], totals: [1_570], total: 1_570, change: 70 },
  postingTimes: { cells: [], best: null },
  durations: [],
  accounts: [],
  topVideos: { views: [], engagements: [], engagementRate: [] },
})

const video = (id: string, title: string): TikTokVideoItemDto => ({
  id,
  accountId: 'a-1',
  accountName: 'Shop A',
  title,
  createdAt: '2026-11-20T03:00:00.000Z',
  duration: 30,
  isAigc: false,
  views: 100,
  likes: 5,
  comments: 1,
  shares: 0,
  engagements: 6,
  engagementRate: 6,
})

describe('TikTokPage', () => {
  let integration: TikTokIntegrationDto
  let dashboardStatus: number
  const asked: URLSearchParams[] = []
  const videoQueries: URLSearchParams[] = []

  beforeEach(() => {
    integration = {
      state: 'connected',
      accounts: [account('a-1', 'Shop A'), account('a-2', 'Shop B')],
      publishingEnabled: true,
      requiredScopes: [],
      optionalScopes: [],
    }
    dashboardStatus = 200
    asked.length = 0
    videoQueries.length = 0
    server.use(
      http.get('*/api/brands/:brandId/tiktok', () => HttpResponse.json({ data: integration })),
      http.get('*/api/brands/:brandId/tiktok/dashboard', ({ request }) => {
        asked.push(new URL(request.url).searchParams)
        return dashboardStatus === 200
          ? HttpResponse.json({ data: dashboard() })
          : HttpResponse.json(
              { error: { code: 'INVALID_DATE_RANGE', message: 'bad' } },
              { status: dashboardStatus },
            )
      }),
      http.get('*/api/brands/:brandId/tiktok/videos', ({ request }) => {
        const params = new URL(request.url).searchParams
        videoQueries.push(params)
        const search = params.get('search') ?? ''
        const items = [video('v-1', 'Cold brew launch'), video('v-2', 'Menu photos')].filter(
          (item) => item.title!.toLowerCase().includes(search.toLowerCase()),
        )
        return HttpResponse.json({ data: { items, total: items.length, page: 1, limit: 20 } })
      }),
    )
  })

  const renderPage = (path = '/platforms/tiktok/overview', granted = ['channels.manage']) =>
    renderRoutes(
      [
        {
          path: '/platforms/tiktok/overview',
          element: (
            <PermissionsContext.Provider value={{ granted, isLoading: false }}>
              <TikTokPage />
            </PermissionsContext.Provider>
          ),
        },
      ],
      { initialPath: path, scope: scopeValue({ workspaceId: 'ws-1', brandId: 'brand-1' }) },
    )

  it('shows the figures of every account for the default period, compared with the one before', async () => {
    renderPage()
    // Large figures are shortened; smaller ones keep every digit.
    expect((await screen.findAllByText(/^12\.3K$/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Views').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1,570').length).toBeGreaterThan(0)
    const query = asked.at(-1)!
    expect(Object.fromEntries(query)).toMatchObject({
      accountId: 'all',
      range: '28d',
      compare: 'previous',
    })
  })

  it('falls back to every account when the address names one that is not connected', async () => {
    renderPage('/platforms/tiktok/overview?accountId=someone-else&range=999d')
    await screen.findAllByText(/^12\.3K$/)
    expect(Object.fromEntries(asked.at(-1)!)).toMatchObject({ accountId: 'all', range: '28d' })
  })

  it('asks for one account’s figures when the address picks it', async () => {
    renderPage('/platforms/tiktok/overview?accountId=a-2')
    await screen.findAllByText(/^12\.3K$/)
    expect(asked.at(-1)!.get('accountId')).toBe('a-2')
  })

  it('explains an error from the API and tries again', async () => {
    dashboardStatus = 400
    renderPage()
    const retry = await screen.findByRole('button', { name: 'Try again' })
    expect(asked).toHaveLength(1)
    dashboardStatus = 200
    await userEvent.click(retry)
    expect((await screen.findAllByText(/^12\.3K$/)).length).toBeGreaterThan(0)
  })

  it('offers to connect TikTok, only to someone who manages channels', async () => {
    integration = { ...integration, state: 'disconnected', accounts: [] }
    renderPage()
    expect(await screen.findByText('Connect TikTok to SocialOps')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect TikTok' })).toBeEnabled()
  })

  it('keeps a viewer from connecting TikTok', async () => {
    integration = { ...integration, state: 'disconnected', accounts: [] }
    renderPage(undefined, [])
    await screen.findByText('Connect TikTok to SocialOps')
    expect(screen.getByText('Your role cannot manage the TikTok connection.')).toBeInTheDocument()
  })

  it('warns about an account that must be connected again', async () => {
    integration.accounts[1] = account('a-2', 'Shop B', { health: 'reconnect_required' })
    renderPage()
    expect(
      await screen.findByText(
        'TikTok ended the access of Shop B. Connect again to keep figures and posting going.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the first sync instead of zeros until an account has data', async () => {
    integration.accounts = integration.accounts.map((item) => ({
      ...item,
      sync: { ...item.sync, status: 'syncing', lastSyncedAt: null },
    }))
    renderPage()
    expect(await screen.findByText('Getting your TikTok figures')).toBeInTheDocument()
    expect(screen.getAllByText('0 of 2 accounts ready').length).toBeGreaterThan(0)
    expect(asked).toHaveLength(0)
  })

  it('lists, searches and opens videos in the videos tab', async () => {
    renderPage('/platforms/tiktok/overview?tab=videos')
    const table = await screen.findByText('Cold brew launch')
    expect(table).toBeInTheDocument()
    expect(Object.fromEntries(videoQueries.at(-1)!)).toMatchObject({
      sortBy: 'createdTime',
      sortOrder: 'desc',
      page: '1',
    })
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search captions' }), 'menu')
    await waitFor(() => expect(videoQueries.at(-1)!.get('search')).toBe('menu'))
    await waitFor(() => expect(screen.queryByText('Cold brew launch')).not.toBeInTheDocument())
    expect(screen.getByText('Menu photos')).toBeInTheDocument()

    await userEvent.clear(screen.getByRole('searchbox', { name: 'Search captions' }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search captions' }), 'nothing')
    expect(await screen.findByText('No video in this period')).toBeInTheDocument()
    expect(within(document.body).getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
  })
})

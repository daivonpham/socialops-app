import { delay, http, HttpResponse } from 'msw'
import { envelope } from '@/mocks/envelope'
import type {
  FacebookAnalyticsDto,
  FacebookIntegrationDto,
  FacebookOverviewDto,
  FacebookPageDto,
  FacebookPostDto,
  ManageableFacebookPageDto,
} from './types'

const ALL_PAGES: FacebookPageDto[] = [
  {
    id: 'fb-aurora-main',
    name: 'Aurora Coffee',
    handle: '@auroracoffee',
    category: 'Coffee shop',
    followers: 48200,
    health: 'connected',
    lastSyncedAt: '2026-08-21T08:45:00+07:00',
  },
  {
    id: 'fb-aurora-roastery',
    name: 'Aurora Roastery',
    handle: '@auroraroastery',
    category: 'Food & beverage',
    followers: 19600,
    health: 'connected',
    lastSyncedAt: '2026-08-21T08:42:00+07:00',
  },
  {
    id: 'fb-aurora-community',
    name: 'Aurora Coffee Community',
    handle: '@auroracommunity',
    category: 'Community',
    followers: 12700,
    health: 'permission_missing',
    lastSyncedAt: '2026-08-20T19:10:00+07:00',
  },
  {
    id: 'fb-nimbus-main',
    name: 'Nimbus Wear',
    handle: '@nimbuswear',
    category: 'Clothing brand',
    followers: 34600,
    health: 'connected',
    lastSyncedAt: '2026-08-21T08:32:00+07:00',
  },
  {
    id: 'fb-nimbus-studio',
    name: 'Nimbus Studio',
    handle: '@nimbusstudio',
    category: 'Retail',
    followers: 8900,
    health: 'connected',
    lastSyncedAt: '2026-08-21T08:30:00+07:00',
  },
  {
    id: 'fb-solstice-main',
    name: 'Solstice Spa',
    handle: '@solsticespa',
    category: 'Health & beauty',
    followers: 25100,
    health: 'connected',
    lastSyncedAt: '2026-08-21T08:20:00+07:00',
  },
  {
    id: 'fb-solstice-wellness',
    name: 'Solstice Wellness',
    handle: '@solsticewellness',
    category: 'Wellness center',
    followers: 14100,
    health: 'token_expiring',
    lastSyncedAt: '2026-08-20T18:20:00+07:00',
  },
]

const PAGE_IDS: Record<string, string[]> = {
  'br-aurora': ['fb-aurora-main', 'fb-aurora-roastery', 'fb-aurora-community'],
  'br-nimbus': [],
  'br-solstice': [],
}

const INTEGRATION_STATE: Record<string, FacebookIntegrationDto['state']> = {
  'br-aurora': 'connected',
  'br-nimbus': 'disconnected',
  'br-solstice': 'needs_page_selection',
}

const manageableFor = (brandId: string) =>
  ALL_PAGES.filter((page) => page.id.includes(brandId.split('-')[1] ?? 'aurora'))
const integrationFor = (brandId: string): FacebookIntegrationDto => ({
  state: INTEGRATION_STATE[brandId] ?? 'disconnected',
  connectedBy: INTEGRATION_STATE[brandId] === 'disconnected' ? undefined : 'Linh Nguyen',
  connectedAt:
    INTEGRATION_STATE[brandId] === 'disconnected' ? undefined : '2026-08-12T09:30:00+07:00',
  pages: (PAGE_IDS[brandId] ?? [])
    .map((id) => ALL_PAGES.find((page) => page.id === id)!)
    .filter(Boolean),
})

export function getMockFacebookPageCount(brandId: string) {
  return PAGE_IDS[brandId]?.length ?? 0
}

const POSTS: FacebookPostDto[] = [
  {
    id: 'post-1',
    pageId: 'fb-aurora-main',
    pageName: 'Aurora Coffee',
    caption: 'Slow mornings, bright notes, and a fresh seasonal pour.',
    mediaType: 'image',
    status: 'published',
    publishedAt: '2026-08-20T08:30:00+07:00',
    reach: 18420,
    engagement: 1260,
    clicks: 418,
  },
  {
    id: 'post-2',
    pageId: 'fb-aurora-roastery',
    pageName: 'Aurora Roastery',
    caption: 'Behind the roast: how our latest single-origin profile comes together.',
    mediaType: 'video',
    status: 'published',
    publishedAt: '2026-08-19T19:00:00+07:00',
    reach: 15280,
    engagement: 984,
    clicks: 316,
  },
  {
    id: 'post-3',
    pageId: 'fb-aurora-main',
    pageName: 'Aurora Coffee',
    caption: 'Friday tasting flight — save your seat for this weekend.',
    mediaType: 'image',
    status: 'scheduled',
    publishedAt: '2026-08-23T10:00:00+07:00',
    reach: 0,
    engagement: 0,
    clicks: 0,
  },
  {
    id: 'post-4',
    pageId: 'fb-aurora-community',
    pageName: 'Aurora Coffee Community',
    caption: 'Meet the makers in our neighborhood coffee series.',
    mediaType: 'image',
    status: 'failed',
    publishedAt: '2026-08-18T17:30:00+07:00',
    reach: 0,
    engagement: 0,
    clicks: 0,
  },
  {
    id: 'post-5',
    pageId: 'fb-aurora-main',
    pageName: 'Aurora Coffee',
    caption: 'A quick guide to choosing your perfect grind size.',
    mediaType: 'text',
    status: 'draft',
    publishedAt: '2026-08-22T09:00:00+07:00',
    reach: 0,
    engagement: 0,
    clicks: 0,
  },
  {
    id: 'post-6',
    pageId: 'fb-aurora-roastery',
    pageName: 'Aurora Roastery',
    caption: 'Small-batch roasting, packed and ready for the weekend.',
    mediaType: 'image',
    status: 'published',
    publishedAt: '2026-08-16T11:20:00+07:00',
    reach: 11940,
    engagement: 752,
    clicks: 201,
  },
]

const TREND = [
  { label: '15 Aug', primary: 12000, comparison: 10500 },
  { label: '16 Aug', primary: 15400, comparison: 12800 },
  { label: '17 Aug', primary: 14200, comparison: 13900 },
  { label: '18 Aug', primary: 18800, comparison: 14700 },
  { label: '19 Aug', primary: 21100, comparison: 16600 },
  { label: '20 Aug', primary: 19600, comparison: 17900 },
  { label: '21 Aug', primary: 23800, comparison: 18400 },
]

const METRICS = [
  { key: 'reach' as const, value: 124800, change: 12.4 },
  { key: 'impressions' as const, value: 286400, change: 8.2 },
  { key: 'engagement' as const, value: 18420, change: 5.7 },
  { key: 'followers' as const, value: 80500, change: 2.1 },
  { key: 'published' as const, value: 42, change: -4.3 },
]

const overviewFor = (brandId: string): FacebookOverviewDto => {
  const pages = integrationFor(brandId).pages
  return {
    metrics: METRICS,
    trend: TREND,
    pagePerformance: pages.map((page, index) => ({
      pageId: page.id,
      pageName: page.name,
      reach: 54800 - index * 9100,
      engagement: 4280 - index * 630,
      followers: page.followers,
      posts: 18 - index * 4,
    })),
    topPosts: POSTS.filter((post) => post.status === 'published').slice(0, 3),
    publishingHealth: { published: 38, scheduled: 6, failed: 2 },
  }
}

const analyticsFor = (brandId: string): FacebookAnalyticsDto => ({
  metrics: METRICS,
  reachTrend: TREND,
  engagementTrend: TREND.map((point) => ({
    ...point,
    primary: Math.round(point.primary / 10),
    comparison: Math.round(point.comparison / 10),
  })),
  audience: [
    { label: '18–24', value: 18 },
    { label: '25–34', value: 42 },
    { label: '35–44', value: 26 },
    { label: '45+', value: 14 },
  ],
  contentBreakdown: [
    { label: 'images', value: 48 },
    { label: 'videos', value: 34 },
    { label: 'text', value: 18 },
  ],
  rows: overviewFor(brandId).pagePerformance.map((row) => ({
    pageId: row.pageId,
    pageName: row.pageName,
    reach: row.reach,
    impressions: row.reach * 2,
    engagementRate: Number(((row.engagement / row.reach) * 100).toFixed(1)),
    followers: row.followers,
  })),
  availability: [
    { metric: 'reach', available: true },
    { metric: 'impressions', available: true },
    { metric: 'videoRetention', available: false, reason: 'advancedPermission' },
    { metric: 'audienceCity', available: false, reason: 'smallAudience' },
  ],
})

const ok = async () => delay(350)

export const facebookHandlers = [
  http.get('/api/brands/:brandId/facebook', async ({ params }) => {
    await ok()
    return HttpResponse.json(
      envelope(
        integrationFor(String(params.brandId)),
        `/brands/${String(params.brandId)}/facebook`,
      ),
    )
  }),
  http.post('/api/brands/:brandId/facebook/connect', async ({ params }) => {
    await delay(650)
    const brandId = String(params.brandId)
    INTEGRATION_STATE[brandId] = 'needs_page_selection'
    return HttpResponse.json(
      envelope(integrationFor(brandId), `/brands/${brandId}/facebook/connect`),
    )
  }),
  http.get('/api/brands/:brandId/facebook/manageable-pages', async ({ params }) => {
    await ok()
    const brandId = String(params.brandId)
    const pages: ManageableFacebookPageDto[] = manageableFor(brandId).map((page) => ({
      ...page,
      selected: PAGE_IDS[brandId]?.includes(page.id) ?? false,
    }))
    return HttpResponse.json(envelope(pages, `/brands/${brandId}/facebook/manageable-pages`))
  }),
  http.post('/api/brands/:brandId/facebook/pages', async ({ params, request }) => {
    await ok()
    const brandId = String(params.brandId)
    const body = (await request.json()) as { pageIds: string[] }
    PAGE_IDS[brandId] = body.pageIds
    INTEGRATION_STATE[brandId] = body.pageIds.length ? 'connected' : 'needs_page_selection'
    return HttpResponse.json(envelope(integrationFor(brandId), `/brands/${brandId}/facebook/pages`))
  }),
  http.post('/api/brands/:brandId/facebook/pages/:pageId/reconnect', async ({ params }) => {
    await delay(550)
    const page = ALL_PAGES.find((item) => item.id === params.pageId)
    if (page) page.health = 'connected'
    return HttpResponse.json(
      envelope(
        integrationFor(String(params.brandId)),
        `/brands/${String(params.brandId)}/facebook/pages/${String(params.pageId)}/reconnect`,
      ),
    )
  }),
  http.delete('/api/brands/:brandId/facebook/pages/:pageId', async ({ params }) => {
    await ok()
    const brandId = String(params.brandId)
    PAGE_IDS[brandId] = (PAGE_IDS[brandId] ?? []).filter((id) => id !== params.pageId)
    INTEGRATION_STATE[brandId] = PAGE_IDS[brandId].length ? 'connected' : 'needs_page_selection'
    return HttpResponse.json(
      envelope(
        integrationFor(brandId),
        `/brands/${brandId}/facebook/pages/${String(params.pageId)}`,
      ),
    )
  }),
  http.delete('/api/brands/:brandId/facebook', async ({ params }) => {
    await ok()
    const brandId = String(params.brandId)
    PAGE_IDS[brandId] = []
    INTEGRATION_STATE[brandId] = 'disconnected'
    return HttpResponse.json(envelope(integrationFor(brandId), `/brands/${brandId}/facebook`))
  }),
  http.get('/api/brands/:brandId/facebook/overview', async ({ params, request }) => {
    await ok()
    const pageId = new URL(request.url).searchParams.get('pageId') ?? 'all'
    const overview = overviewFor(String(params.brandId))
    const data =
      pageId === 'all'
        ? overview
        : {
            ...overview,
            pagePerformance: overview.pagePerformance.filter((row) => row.pageId === pageId),
            topPosts: overview.topPosts.filter((post) => post.pageId === pageId),
          }
    return HttpResponse.json(envelope(data, `/brands/${String(params.brandId)}/facebook/overview`))
  }),
  http.get('/api/brands/:brandId/facebook/posts', async ({ params, request }) => {
    await ok()
    const url = new URL(request.url)
    const pageId = url.searchParams.get('pageId') ?? 'all'
    const status = url.searchParams.get('status') ?? 'all'
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase()
    const page = Number(url.searchParams.get('page') ?? 1)
    const filtered = POSTS.filter(
      (post) =>
        (pageId === 'all' || post.pageId === pageId) &&
        (status === 'all' || post.status === status) &&
        post.caption.toLowerCase().includes(keyword),
    )
    const pageSize = 5
    return HttpResponse.json(
      envelope(
        {
          items: filtered.slice((page - 1) * pageSize, page * pageSize),
          total: filtered.length,
          page,
          pageSize,
        },
        `/brands/${String(params.brandId)}/facebook/posts`,
      ),
    )
  }),
  http.post('/api/brands/:brandId/facebook/posts', async ({ params, request }) => {
    await delay(500)
    const body = (await request.json()) as {
      pageIds: string[]
      caption: string
      publishNow: boolean
    }
    const page = ALL_PAGES.find((item) => item.id === body.pageIds[0])!
    const post: FacebookPostDto = {
      id: `post-${POSTS.length + 1}`,
      pageId: page.id,
      pageName: page.name,
      caption: body.caption,
      mediaType: 'text',
      status: body.publishNow ? 'publishing' : 'scheduled',
      publishedAt: new Date().toISOString(),
      reach: 0,
      engagement: 0,
      clicks: 0,
    }
    POSTS.unshift(post)
    return HttpResponse.json(envelope(post, `/brands/${String(params.brandId)}/facebook/posts`))
  }),
  http.get('/api/brands/:brandId/facebook/analytics', async ({ params, request }) => {
    await ok()
    const pageId = new URL(request.url).searchParams.get('pageId') ?? 'all'
    const analytics = analyticsFor(String(params.brandId))
    const data =
      pageId === 'all'
        ? analytics
        : { ...analytics, rows: analytics.rows.filter((row) => row.pageId === pageId) }
    return HttpResponse.json(envelope(data, `/brands/${String(params.brandId)}/facebook/analytics`))
  }),
]

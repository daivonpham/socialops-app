import { delay, http, HttpResponse } from 'msw'
import { envelope } from '@/mocks/envelope'
import type {
  FacebookAnalyticsDto,
  FacebookIntegrationDto,
  FacebookOverviewDto,
  FacebookPageDto,
  FacebookPostDto,
  ManageableFacebookPageDto,
  MetricDto,
} from './types'

const ALL_PAGES: FacebookPageDto[] = [
  {
    id: 'fb-aurora-main',
    name: 'Aurora Coffee',
    username: 'auroracoffee',
    category: 'Coffee shop',
    followersCount: 48200,
    health: 'connected',
    lastSyncedAt: '2026-08-21T08:45:00+07:00',
  },
  {
    id: 'fb-aurora-roastery',
    name: 'Aurora Roastery',
    username: 'auroraroastery',
    category: 'Food & beverage',
    followersCount: 19600,
    health: 'connected',
    lastSyncedAt: '2026-08-21T08:42:00+07:00',
  },
  {
    id: 'fb-aurora-community',
    name: 'Aurora Coffee Community',
    username: 'auroracommunity',
    category: 'Community',
    followersCount: 12700,
    health: 'permission_missing',
    lastSyncedAt: '2026-08-20T19:10:00+07:00',
  },
  {
    id: 'fb-nimbus-main',
    name: 'Nimbus Wear',
    username: 'nimbuswear',
    category: 'Clothing brand',
    followersCount: 34600,
    health: 'connected',
    lastSyncedAt: '2026-08-21T08:32:00+07:00',
  },
  {
    id: 'fb-nimbus-studio',
    name: 'Nimbus Studio',
    username: 'nimbusstudio',
    category: 'Retail',
    followersCount: 8900,
    health: 'connected',
    lastSyncedAt: '2026-08-21T08:30:00+07:00',
  },
  {
    id: 'fb-solstice-main',
    name: 'Solstice Spa',
    username: 'solsticespa',
    category: 'Health & beauty',
    followersCount: 25100,
    health: 'connected',
    lastSyncedAt: '2026-08-21T08:20:00+07:00',
  },
  {
    id: 'fb-solstice-wellness',
    name: 'Solstice Wellness',
    username: 'solsticewellness',
    category: 'Wellness center',
    followersCount: 14100,
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
    message: 'Slow mornings, bright notes, and a fresh seasonal pour.',
    mediaType: 'image',
    status: 'published',
    createdAt: '2026-08-20T08:20:00+07:00',
    publishedAt: '2026-08-20T08:30:00+07:00',
    mediaViews: 18420,
    contentInteractions: 1260,
    clicks: 418,
  },
  {
    id: 'post-2',
    pageId: 'fb-aurora-roastery',
    pageName: 'Aurora Roastery',
    message: 'Behind the roast: how our latest single-origin profile comes together.',
    mediaType: 'video',
    status: 'published',
    createdAt: '2026-08-19T18:45:00+07:00',
    publishedAt: '2026-08-19T19:00:00+07:00',
    mediaViews: 15280,
    contentInteractions: 984,
    clicks: 316,
  },
  {
    id: 'post-3',
    pageId: 'fb-aurora-main',
    pageName: 'Aurora Coffee',
    message: 'Friday tasting flight — save your seat for this weekend.',
    mediaType: 'image',
    status: 'scheduled',
    createdAt: '2026-08-21T09:00:00+07:00',
    scheduledAt: '2026-08-25T10:00:00+07:00',
    mediaViews: 0,
    contentInteractions: 0,
    clicks: 0,
  },
  {
    id: 'post-4',
    pageId: 'fb-aurora-community',
    pageName: 'Aurora Coffee Community',
    message: 'Meet the makers in our neighborhood coffee series.',
    mediaType: 'image',
    status: 'failed',
    createdAt: '2026-08-18T17:30:00+07:00',
    mediaViews: 0,
    contentInteractions: 0,
    clicks: 0,
  },
  {
    id: 'post-5',
    pageId: 'fb-aurora-main',
    pageName: 'Aurora Coffee',
    message: 'A quick guide to choosing your perfect grind size.',
    mediaType: 'text',
    status: 'draft',
    createdAt: '2026-08-22T09:00:00+07:00',
    mediaViews: 0,
    contentInteractions: 0,
    clicks: 0,
  },
  {
    id: 'post-6',
    pageId: 'fb-aurora-roastery',
    pageName: 'Aurora Roastery',
    message: 'Small-batch roasting, packed and ready for the weekend.',
    mediaType: 'image',
    status: 'published',
    createdAt: '2026-08-16T11:10:00+07:00',
    publishedAt: '2026-08-16T11:20:00+07:00',
    mediaViews: 11940,
    contentInteractions: 752,
    clicks: 201,
  },
]

const MEDIA_VIEWS_TREND = [
  { label: '15 Aug', primary: 12000, comparison: 10500 },
  { label: '16 Aug', primary: 15400, comparison: 12800 },
  { label: '17 Aug', primary: 14200, comparison: 13900 },
  { label: '18 Aug', primary: 18800, comparison: 14700 },
  { label: '19 Aug', primary: 21100, comparison: 16600 },
  { label: '20 Aug', primary: 19600, comparison: 17900 },
  { label: '21 Aug', primary: 23800, comparison: 18400 },
]

const METRICS = [
  { key: 'mediaViews' as const, value: 124800, change: 12.4 },
  { key: 'uniqueViewers' as const, value: 84200, change: 8.2, estimated: true },
  { key: 'contentInteractions' as const, value: 18420, change: 5.7 },
  { key: 'followers' as const, value: 80500, change: 2.1 },
  { key: 'published' as const, value: 42, change: -4.3 },
]

const overviewFor = (brandId: string): FacebookOverviewDto => {
  const pages = integrationFor(brandId).pages
  return {
    metrics: METRICS,
    mediaViewsTrend: MEDIA_VIEWS_TREND,
    pagePerformance: pages.map((page, index) => ({
      pageId: page.id,
      pageName: page.name,
      mediaViews: 54800 - index * 9100,
      uniqueViewers: 38200 - index * 6800,
      contentInteractions: 4280 - index * 630,
      followersCount: page.followersCount,
      publishedPosts: 18 - index * 4,
    })),
    topPosts: POSTS.filter((post) => post.status === 'published')
      .slice()
      .sort((left, right) => right.mediaViews - left.mediaViews)
      .slice(0, 3),
  }
}

function metricsForPage(row: FacebookOverviewDto['pagePerformance'][number]): MetricDto[] {
  const values: Record<MetricDto['key'], number> = {
    mediaViews: row.mediaViews,
    uniqueViewers: row.uniqueViewers,
    contentInteractions: row.contentInteractions,
    followers: row.followersCount,
    published: row.publishedPosts,
  }
  return METRICS.map((metric) => ({ ...metric, value: values[metric.key] }))
}

function scaleTrend(points: typeof MEDIA_VIEWS_TREND, ratio: number) {
  return points.map((point) => ({
    ...point,
    primary: Math.round(point.primary * ratio),
    comparison: Math.round(point.comparison * ratio),
  }))
}

const analyticsFor = (brandId: string): FacebookAnalyticsDto => ({
  metrics: METRICS,
  mediaViewsTrend: MEDIA_VIEWS_TREND,
  contentInteractionsTrend: MEDIA_VIEWS_TREND.map((point) => ({
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
    mediaViews: row.mediaViews,
    uniqueViewers: row.uniqueViewers,
    contentInteractions: row.contentInteractions,
    followersCount: row.followersCount,
  })),
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
    const selectedPage = overview.pagePerformance.find((row) => row.pageId === pageId)
    const ratio = selectedPage
      ? selectedPage.mediaViews /
        (METRICS.find((metric) => metric.key === 'mediaViews')?.value ?? 1)
      : 1
    const data =
      pageId === 'all' || !selectedPage
        ? overview
        : {
            ...overview,
            metrics: metricsForPage(selectedPage),
            mediaViewsTrend: scaleTrend(overview.mediaViewsTrend, ratio),
            pagePerformance: [selectedPage],
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
        `${post.message} ${post.pageName}`.toLowerCase().includes(keyword),
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
      message: string
      publishNow: boolean
      scheduledAt?: string
    }
    const createdAt = new Date().toISOString()
    const createdPosts = body.pageIds.flatMap((pageId, index) => {
      const page = ALL_PAGES.find((item) => item.id === pageId)
      if (!page) return []
      const post: FacebookPostDto = {
        id: `post-${POSTS.length + index + 1}`,
        pageId: page.id,
        pageName: page.name,
        message: body.message,
        mediaType: 'text',
        status: body.publishNow ? 'publishing' : 'scheduled',
        createdAt,
        scheduledAt: body.publishNow ? undefined : body.scheduledAt,
        mediaViews: 0,
        contentInteractions: 0,
        clicks: 0,
      }
      return [post]
    })
    POSTS.unshift(...createdPosts)
    return HttpResponse.json(
      envelope(createdPosts, `/brands/${String(params.brandId)}/facebook/posts`),
    )
  }),
  http.get('/api/brands/:brandId/facebook/analytics', async ({ params, request }) => {
    await ok()
    const pageId = new URL(request.url).searchParams.get('pageId') ?? 'all'
    const analytics = analyticsFor(String(params.brandId))
    const selectedRow = analytics.rows.find((row) => row.pageId === pageId)
    const overviewRow = overviewFor(String(params.brandId)).pagePerformance.find(
      (row) => row.pageId === pageId,
    )
    const ratio = overviewRow
      ? overviewRow.mediaViews / (METRICS.find((metric) => metric.key === 'mediaViews')?.value ?? 1)
      : 1
    const data =
      pageId === 'all' || !selectedRow || !overviewRow
        ? analytics
        : {
            ...analytics,
            metrics: metricsForPage(overviewRow),
            mediaViewsTrend: scaleTrend(analytics.mediaViewsTrend, ratio),
            contentInteractionsTrend: scaleTrend(analytics.contentInteractionsTrend, ratio),
            rows: [selectedRow],
          }
    return HttpResponse.json(envelope(data, `/brands/${String(params.brandId)}/facebook/analytics`))
  }),
]

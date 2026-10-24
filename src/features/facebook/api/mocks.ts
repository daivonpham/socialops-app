import { delay, http, HttpResponse } from 'msw'
import { envelope } from '@/mocks/envelope'
import type {
  FacebookAnalyticsDto,
  FacebookIntegrationDto,
  FacebookOverviewDto,
  FacebookPageDto,
  FacebookPostDto,
  FacebookSyncStatusDto,
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
  'br-solstice': ['fb-solstice-main', 'fb-solstice-wellness'],
}

const INTEGRATION_STATE: Record<string, FacebookIntegrationDto['state']> = {
  'br-aurora': 'connected',
  'br-nimbus': 'disconnected',
  'br-solstice': 'connected',
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
  { key: 'contentInteractions' as const, value: 18420, change: 5.7 },
  { key: 'followers' as const, value: 80500, change: 2.1 },
  { key: 'published' as const, value: 42, change: -4.3 },
]

const ANALYTICS_METRICS: MetricDto[] = [
  METRICS[0],
  { key: 'uniqueViewers', value: 84200, change: 8.2, estimated: true },
  ...METRICS.slice(1),
  { key: 'profileViews', value: 15600, change: 6.8 },
  { key: 'netFollows', value: 1280, change: 4.6 },
  { key: 'engagementRate', value: 14.8, change: 1.2, unit: 'percent' },
]

const overviewFor = (brandId: string): FacebookOverviewDto => {
  const pages = integrationFor(brandId).pages
  return {
    insightsAvailable: true,
    metrics: METRICS,
    contentInteractionsTrend: MEDIA_VIEWS_TREND,
    pagePerformance: pages.map((page, index) => ({
      pageId: page.id,
      pageName: page.name,
      avatarUrl: page.avatarUrl,
      mediaViews: 54800 - index * 9100,
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
  const values: Partial<Record<MetricDto['key'], number>> = {
    mediaViews: row.mediaViews,
    contentInteractions: row.contentInteractions,
    followers: row.followersCount,
    published: row.publishedPosts,
  }
  return METRICS.map((metric) => ({ ...metric, value: values[metric.key] ?? metric.value }))
}

function analyticsMetricsForPage(row: FacebookOverviewDto['pagePerformance'][number]): MetricDto[] {
  const values: Partial<Record<MetricDto['key'], number>> = {
    mediaViews: row.mediaViews,
    uniqueViewers: Math.round(row.mediaViews * 0.72),
    contentInteractions: row.contentInteractions,
    followers: row.followersCount,
    published: row.publishedPosts,
  }
  return ANALYTICS_METRICS.map((metric) => ({
    ...metric,
    value: values[metric.key] ?? metric.value,
  }))
}

function scaleTrend(points: typeof MEDIA_VIEWS_TREND, ratio: number) {
  return points.map((point) => ({
    ...point,
    primary: Math.round(point.primary * ratio),
    comparison: Math.round(point.comparison * ratio),
  }))
}

const analyticsFor = (brandId: string): FacebookAnalyticsDto => ({
  insightsAvailable: true,
  metrics: ANALYTICS_METRICS,
  mediaViewsTrend: MEDIA_VIEWS_TREND,
  uniqueViewersTrend: MEDIA_VIEWS_TREND.map((point) => ({
    ...point,
    primary: Math.round(point.primary * 0.72),
    comparison: Math.round(point.comparison * 0.72),
  })),
  contentInteractionsTrend: MEDIA_VIEWS_TREND.map((point) => ({
    ...point,
    primary: Math.round(point.primary / 10),
    comparison: Math.round(point.comparison / 10),
  })),
  followerGrowthTrend: MEDIA_VIEWS_TREND.map((point) => ({
    ...point,
    primary: Math.round(point.primary / 300),
    comparison: Math.round(point.comparison / 300),
  })),
  audience: [
    { label: '18–24', value: 18 },
    { label: '25–34', value: 42 },
    { label: '35–44', value: 26 },
    { label: '45+', value: 14 },
  ],
  audienceCountries: [
    { label: 'VN', value: 88 },
    { label: 'US', value: 7 },
    { label: 'Other', value: 5 },
  ],
  audienceCities: [
    { label: 'Ho Chi Minh City', value: 54 },
    { label: 'Hanoi', value: 28 },
    { label: 'Other', value: 18 },
  ],
  contentBreakdown: [
    { label: 'images', value: 48 },
    { label: 'videos', value: 34 },
    { label: 'links', value: 10 },
    { label: 'text', value: 8 },
  ],
  rows: overviewFor(brandId).pagePerformance.map((row) => ({
    pageId: row.pageId,
    pageName: row.pageName,
    avatarUrl: integrationFor(brandId).pages.find((page) => page.id === row.pageId)?.avatarUrl,
    mediaViews: row.mediaViews,
    uniqueViewers: Math.round(row.mediaViews * 0.72),
    contentInteractions: row.contentInteractions,
    followersCount: row.followersCount,
    profileViews: Math.round(row.mediaViews / 8),
    netFollows: Math.round(row.followersCount / 25),
    publishedPosts: row.publishedPosts,
    engagementRate: row.mediaViews
      ? Math.round((row.contentInteractions / row.mediaViews) * 10_000) / 100
      : 0,
  })),
  availableMetrics: [
    'mediaViews',
    'uniqueViewers',
    'contentInteractions',
    'profileViews',
    'netFollows',
  ],
  unavailableMetrics: [],
  lastUpdatedAt: new Date().toISOString(),
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
    PAGE_IDS[brandId] = manageableFor(brandId).map((page) => page.id)
    INTEGRATION_STATE[brandId] = 'connected'
    return HttpResponse.json(
      envelope(integrationFor(brandId), `/brands/${brandId}/facebook/connect`),
    )
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
    INTEGRATION_STATE[brandId] = PAGE_IDS[brandId].length ? 'connected' : 'disconnected'
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
            contentInteractionsTrend: scaleTrend(overview.contentInteractionsTrend, ratio),
            pagePerformance: [selectedPage],
            topPosts: overview.topPosts.filter((post) => post.pageId === pageId),
          }
    return HttpResponse.json(envelope(data, `/brands/${String(params.brandId)}/facebook/overview`))
  }),
  http.get('/api/brands/:brandId/facebook/overview/summary', async ({ params, request }) => {
    await ok()
    const pageId = new URL(request.url).searchParams.get('pageId') ?? 'all'
    const overview = overviewFor(String(params.brandId))
    const rows =
      pageId === 'all'
        ? overview.pagePerformance
        : overview.pagePerformance.filter((row) => row.pageId === pageId)
    return HttpResponse.json(
      envelope(
        {
          insightsAvailable: overview.insightsAvailable,
          metrics: overview.metrics.filter((metric) => metric.key !== 'published'),
          contentInteractionsTrend: overview.contentInteractionsTrend,
          pagePerformance: rows.map((row) => ({
            pageId: row.pageId,
            pageName: row.pageName,
            avatarUrl: row.avatarUrl,
            mediaViews: row.mediaViews,
            contentInteractions: row.contentInteractions,
            followersCount: row.followersCount,
          })),
        },
        `/brands/${String(params.brandId)}/facebook/overview/summary`,
      ),
    )
  }),
  http.get('/api/brands/:brandId/facebook/overview/details', async ({ params, request }) => {
    await delay(700)
    const pageId = new URL(request.url).searchParams.get('pageId') ?? 'all'
    const overview = overviewFor(String(params.brandId))
    const rows =
      pageId === 'all'
        ? overview.pagePerformance
        : overview.pagePerformance.filter((row) => row.pageId === pageId)
    return HttpResponse.json(
      envelope(
        {
          publishedMetric: overview.metrics.find((metric) => metric.key === 'published'),
          publishedPostsByPage: rows.map((row) => ({
            pageId: row.pageId,
            publishedPosts: row.publishedPosts,
          })),
          topPosts: overview.topPosts.filter((post) => pageId === 'all' || post.pageId === pageId),
        },
        `/brands/${String(params.brandId)}/facebook/overview/details`,
      ),
    )
  }),
  http.get('/api/brands/:brandId/facebook/recent-posts', async ({ params, request }) => {
    await delay(350)
    const url = new URL(request.url)
    const pageId = url.searchParams.get('pageId') ?? 'all'
    const search = (url.searchParams.get('search') ?? '').toLocaleLowerCase()
    const contentType = url.searchParams.get('contentType') ?? 'all'
    const since = url.searchParams.get('since')
    const until = url.searchParams.get('until')
    const sortBy = url.searchParams.get('sortBy') ?? 'publishedAt'
    const direction = url.searchParams.get('sortOrder') === 'asc' ? 1 : -1
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20)))
    const rows = POSTS.filter((post) => post.status === 'published')
      .map((post) => ({ ...post, contentType: 'post' as const }))
      .filter((post) => contentType === 'all' || post.contentType === contentType)
      .filter((post) => pageId === 'all' || post.pageId === pageId)
      .filter(
        (post) =>
          !search || `${post.message} ${post.pageName}`.toLocaleLowerCase().includes(search),
      )
      .filter((post) => !since || (post.publishedAt ?? post.createdAt).slice(0, 10) >= since)
      .filter((post) => !until || (post.publishedAt ?? post.createdAt).slice(0, 10) <= until)
      .sort((a, b) => {
        const left =
          sortBy === 'publishedAt'
            ? Date.parse(a.publishedAt ?? a.createdAt)
            : Number(a[sortBy as keyof FacebookPostDto] ?? 0)
        const right =
          sortBy === 'publishedAt'
            ? Date.parse(b.publishedAt ?? b.createdAt)
            : Number(b[sortBy as keyof FacebookPostDto] ?? 0)
        return (left - right) * direction
      })
    return HttpResponse.json(
      envelope(
        { items: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit },
        `/brands/${String(params.brandId)}/facebook/recent-posts`,
      ),
    )
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
            metrics: analyticsMetricsForPage(overviewRow),
            mediaViewsTrend: scaleTrend(analytics.mediaViewsTrend, ratio),
            contentInteractionsTrend: scaleTrend(analytics.contentInteractionsTrend, ratio),
            rows: [selectedRow],
          }
    return HttpResponse.json(envelope(data, `/brands/${String(params.brandId)}/facebook/analytics`))
  }),
  http.get('/api/brands/:brandId/facebook/analytics/summary', async ({ params, request }) => {
    await ok()
    const pageId = new URL(request.url).searchParams.get('pageId') ?? 'all'
    const analytics = analyticsFor(String(params.brandId))
    const rows =
      pageId === 'all' ? analytics.rows : analytics.rows.filter((row) => row.pageId === pageId)
    return HttpResponse.json(
      envelope(
        {
          insightsAvailable: analytics.insightsAvailable,
          metrics: analytics.metrics.filter((metric) => metric.key !== 'published'),
          mediaViewsTrend: analytics.mediaViewsTrend,
          uniqueViewersTrend: analytics.uniqueViewersTrend,
          contentInteractionsTrend: analytics.contentInteractionsTrend,
          followerGrowthTrend: analytics.followerGrowthTrend,
          rows: rows.map((row) => ({
            pageId: row.pageId,
            pageName: row.pageName,
            avatarUrl: row.avatarUrl,
            mediaViews: row.mediaViews,
            uniqueViewers: row.uniqueViewers,
            contentInteractions: row.contentInteractions,
            followersCount: row.followersCount,
            profileViews: row.profileViews,
            netFollows: row.netFollows,
            engagementRate: row.engagementRate,
          })),
          availableMetrics: analytics.availableMetrics,
          unavailableMetrics: analytics.unavailableMetrics,
          lastUpdatedAt: analytics.lastUpdatedAt,
        },
        `/brands/${String(params.brandId)}/facebook/analytics/summary`,
      ),
    )
  }),
  http.get('/api/brands/:brandId/facebook/analytics/details', async ({ params, request }) => {
    await delay(700)
    const pageId = new URL(request.url).searchParams.get('pageId') ?? 'all'
    const analytics = analyticsFor(String(params.brandId))
    const rows =
      pageId === 'all' ? analytics.rows : analytics.rows.filter((row) => row.pageId === pageId)
    return HttpResponse.json(
      envelope(
        {
          publishedMetric: analytics.metrics.find((metric) => metric.key === 'published'),
          audienceCountries: analytics.audienceCountries,
          audienceCities: analytics.audienceCities,
          contentBreakdown: analytics.contentBreakdown,
          publishedPostsByPage: rows.map((row) => ({
            pageId: row.pageId,
            publishedPosts: row.publishedPosts,
          })),
        },
        `/brands/${String(params.brandId)}/facebook/analytics/details`,
      ),
    )
  }),
  http.get('/api/brands/:brandId/facebook/details', async ({ params, request }) => {
    await delay(700)
    const pageId = new URL(request.url).searchParams.get('pageId') ?? 'all'
    const brandId = String(params.brandId)
    const analytics = analyticsFor(brandId)
    const overview = overviewFor(brandId)
    const rows =
      pageId === 'all' ? analytics.rows : analytics.rows.filter((row) => row.pageId === pageId)

    return HttpResponse.json(
      envelope(
        {
          publishedMetric: analytics.metrics.find((metric) => metric.key === 'published') ?? {
            key: 'published',
            value: 0,
            change: 0,
          },
          audienceCountries: analytics.audienceCountries,
          audienceCities: analytics.audienceCities,
          contentBreakdown: analytics.contentBreakdown,
          publishedPostsByPage: rows.map((row) => ({
            pageId: row.pageId,
            publishedPosts: row.publishedPosts,
          })),
          topPosts: overview.topPosts.filter((post) => pageId === 'all' || post.pageId === pageId),
        },
        `/brands/${brandId}/facebook/details`,
      ),
    )
  }),
  http.get('/api/brands/:brandId/facebook/sync', async ({ params }) => {
    await ok()
    return HttpResponse.json(envelope(syncStatusFor(String(params.brandId)), 'facebook/sync'))
  }),
  http.post('/api/brands/:brandId/facebook/sync', async ({ params }) => {
    await ok()
    return HttpResponse.json(envelope(syncStatusFor(String(params.brandId)), 'facebook/sync'))
  }),
]

function syncStatusFor(brandId: string): FacebookSyncStatusDto {
  const syncedAt = new Date().toISOString()
  return {
    syncing: false,
    lastSyncedAt: syncedAt,
    refreshAvailableAt: null,
    pages: (PAGE_IDS[brandId] ?? []).map((pageId) => ({
      pageId,
      name: `Page ${pageId}`,
      status: 'idle',
      failureCount: 0,
      lastSyncedAt: syncedAt,
      historyStartAt: null,
      backfillCompleted: true,
      lastErrorCode: null,
    })),
  }
}

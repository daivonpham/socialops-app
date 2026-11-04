import { delay, http, HttpResponse } from 'msw'
import { envelope } from '@/mocks/envelope'
import type {
  FacebookAnalyticsDto,
  FacebookDashboardDto,
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
  http.get('/api/brands/:brandId/facebook/dashboard', async ({ params, request }) => {
    await ok()
    const search = new URL(request.url).searchParams
    const pageId = search.get('pageId') ?? 'all'
    const days = Number((search.get('range') ?? '28d').slice(0, -1)) || 28
    const overview = overviewFor(String(params.brandId))
    const rows = overview.pagePerformance.filter((row) => pageId === 'all' || row.pageId === pageId)
    return HttpResponse.json(
      envelope(
        dashboardFor(rows, overview.topPosts, days),
        `/brands/${String(params.brandId)}/facebook/dashboard`,
      ),
    )
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
    pages: (PAGE_IDS[brandId] ?? []).map((pageId) => ({
      pageId,
      name: `Page ${pageId}`,
      status: 'idle',
      failureCount: 0,
      lastSyncedAt: syncedAt,
      historyStartAt: null,
      backfillCompleted: true,
      lastErrorCode: null,
      refreshAvailableAt: null,
    })),
  }
}

/** Deterministic dashboard numbers shaped like the API, scaled by each Page's views. */
function dashboardFor(
  rows: FacebookOverviewDto['pagePerformance'],
  posts: FacebookPostDto[],
  days: number,
): FacebookDashboardDto {
  const start = new Date(Date.now() - (days - 1) * 86_400_000)
  const labels = Array.from({ length: days }, (_, index) =>
    new Date(start.getTime() + index * 86_400_000).toISOString().slice(0, 10),
  )
  const scale = rows.reduce((sum, row) => sum + row.mediaViews, 0) / 30
  const wave = (offset: number, factor: number) =>
    labels.map((_, index) =>
      Math.round(scale * factor * (1 + 0.35 * Math.sin((index + offset) / 2.3))),
    )
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
  const views = { current: wave(0, 1), previous: wave(3, 0.92) }
  const viewers = { current: wave(1, 0.6), previous: wave(4, 0.55) }
  const engagements = { current: wave(2, 0.06), previous: wave(5, 0.055) }
  const videoViews = { current: wave(0, 0.4), previous: wave(2, 0.38) }
  const follows = wave(1, 0.004)
  const unfollows = wave(6, 0.0015)
  const kpi = (current: number[], previous: number[]) => {
    const value = sum(current)
    const before = sum(previous)
    return {
      value,
      previous: before,
      change: before ? Math.round(((value - before) / before) * 1000) / 10 : 0,
      series: current,
    }
  }
  const viewerTotal = Math.round(sum(viewers.current) * 0.45)
  const previousViewers = Math.round(sum(viewers.previous) * 0.45)
  const engagementTotal = sum(engagements.current)
  const followers = rows.reduce((total, row) => total + row.followersCount, 0)
  const toPost = (post: FacebookPostDto, index: number) => ({
    id: post.id,
    pageId: post.pageId,
    pageName: post.pageName,
    message: post.message,
    format: (['reel', 'video', 'photo', 'album', 'link'] as const)[index % 5]!,
    createdAt: post.createdAt,
    thumbnailUrl: post.thumbnailUrl,
    permalinkUrl: post.permalinkUrl,
    viewers: Math.round(post.mediaViews * 0.7),
    engagements: post.contentInteractions,
    comments: post.comments ?? 0,
    engagementRate: post.mediaViews
      ? Math.round((post.contentInteractions / (post.mediaViews * 0.7)) * 10_000) / 100
      : 0,
  })
  const top = posts.slice(0, 5).map(toPost)
  return {
    insightsAvailable: rows.length > 0,
    period: { since: labels[0]!, until: labels.at(-1)!, days, timeZone: 'Asia/Ho_Chi_Minh' },
    kpis: {
      viewers: {
        ...kpi(viewers.current, viewers.previous),
        value: viewerTotal,
        previous: previousViewers,
        estimated: rows.length > 1 || (days !== 7 && days !== 28),
      },
      views: {
        ...kpi(views.current, views.previous),
        frequency: viewerTotal ? Math.round((sum(views.current) / viewerTotal) * 100) / 100 : 0,
      },
      engagements: kpi(engagements.current, engagements.previous),
      engagementRate: {
        value: viewerTotal ? Math.round((engagementTotal / viewerTotal) * 10_000) / 100 : 0,
        previous: 5.4,
        change: 4.1,
        series: engagements.current.map((value, index) =>
          viewers.current[index] ? (value / viewers.current[index]!) * 100 : 0,
        ),
      },
      netFollows: {
        ...kpi(
          follows.map((value, index) => value - (unfollows[index] ?? 0)),
          follows.map((value, index) => Math.round((value - (unfollows[index] ?? 0)) * 0.9)),
        ),
        followers,
      },
      videoViews: kpi(videoViews.current, videoViews.previous),
      followers: { value: followers, previous: followers - 12, change: 0.7, series: [] },
      posts: { value: 18, previous: 15, change: 20, series: [] },
      pageViews: kpi(wave(3, 0.02), wave(1, 0.018)),
    },
    trend: { labels, viewers, views, engagements, videoViews },
    interactions: {
      reactions: Math.round(engagementTotal * 0.6),
      comments: Math.round(engagementTotal * 0.13),
      shares: Math.round(engagementTotal * 0.12),
      linkClicks: Math.round(engagementTotal * 0.15),
      reactionTypes: [
        { type: 'like', value: Math.round(engagementTotal * 0.42) },
        { type: 'love', value: Math.round(engagementTotal * 0.11) },
        { type: 'haha', value: Math.round(engagementTotal * 0.03) },
        { type: 'care', value: Math.round(engagementTotal * 0.02) },
        { type: 'wow', value: Math.round(engagementTotal * 0.01) },
      ],
    },
    followers: {
      labels,
      follows,
      unfollows,
      totalFollows: sum(follows),
      totalUnfollows: sum(unfollows),
      net: sum(follows) - sum(unfollows),
      total: followers,
    },
    postingTimes: {
      cells: Array.from({ length: 7 * 12 }, (_, index) => ({
        day: index % 7,
        slot: Math.floor(index / 7),
        posts: 1 + (index % 3),
        engagementRate: Math.round((2 + 4 * Math.abs(Math.sin(index / 5))) * 100) / 100,
      })).filter((cell) => cell.slot >= 3),
      best: { day: 6, slot: 10 },
    },
    audience: {
      countries: [
        { label: 'VN', value: 92.4 },
        { label: 'US', value: 2.1 },
        { label: 'JP', value: 1.3 },
        { label: 'other', value: 4.2 },
      ],
      cities: [
        { label: 'Ho Chi Minh City', value: 66 },
        { label: 'Bình Dương', value: 8 },
        { label: 'Đồng Nai', value: 6 },
        { label: 'Hanoi', value: 5 },
        { label: 'Cần Thơ', value: 4 },
        { label: 'other', value: 11 },
      ],
    },
    formats: [
      { format: 'reel', posts: 4, averageViewers: 17_100, engagementRate: 7.8 },
      { format: 'video', posts: 3, averageViewers: 10_800, engagementRate: 6.1 },
      { format: 'album', posts: 2, averageViewers: 8_443, engagementRate: 5.9 },
      { format: 'photo', posts: 6, averageViewers: 6_969, engagementRate: 5.4 },
      { format: 'text', posts: 1, averageViewers: 3_038, engagementRate: 3.1 },
      { format: 'link', posts: 2, averageViewers: 4_110, engagementRate: 2.3 },
    ],
    pages: rows.map((row, index) => ({
      pageId: row.pageId,
      pageName: row.pageName,
      avatarUrl: row.avatarUrl,
      followers: row.followersCount,
      netFollows: Math.round(row.followersCount * 0.012),
      viewers: Math.round(row.mediaViews * 0.6),
      viewersChange: [4.3, -5.5, 5.6][index % 3]!,
      engagements: row.contentInteractions,
      engagementRate: row.mediaViews
        ? Math.round((row.contentInteractions / (row.mediaViews * 0.6)) * 10_000) / 100
        : 0,
      posts: row.publishedPosts,
      pageViews: Math.round(row.mediaViews * 0.04),
      viewersSeries: wave(index * 2, row.mediaViews / Math.max(1, scale * 30)),
    })),
    topPosts: {
      viewers: [...top].sort((left, right) => right.viewers - left.viewers),
      engagements: [...top].sort((left, right) => right.engagements - left.engagements),
      engagementRate: [...top].sort((left, right) => right.engagementRate - left.engagementRate),
    },
  }
}

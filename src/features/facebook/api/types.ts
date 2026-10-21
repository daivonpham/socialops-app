export type FacebookConnectionState = 'disconnected' | 'connected'
export type FacebookPageHealth =
  'connected' | 'token_expiring' | 'token_expired' | 'permission_missing' | 'disconnected'
export type FacebookTab = 'overview' | 'analytics'
export type DateRange = '7d' | '30d' | '90d'

export type FacebookPageDto = {
  id: string
  name: string
  avatarUrl?: string
  username: string
  category: string
  followersCount: number
  health: FacebookPageHealth
  lastSyncedAt: string
}

export type FacebookIntegrationDto = {
  state: FacebookConnectionState
  connectedBy?: string
  connectedAt?: string
  pages: FacebookPageDto[]
}

export type MetricKey =
  | 'mediaViews'
  | 'uniqueViewers'
  | 'contentInteractions'
  | 'followers'
  | 'published'
  | 'profileViews'
  | 'netFollows'
  | 'engagementRate'

export type MetricDto = {
  key: MetricKey
  value: number
  change: number
  estimated?: boolean
  unit?: 'number' | 'percent'
}

export type TrendPointDto = { label: string; primary: number; comparison: number }

export type FacebookOverviewDto = {
  insightsAvailable: boolean
  metrics: MetricDto[]
  contentInteractionsTrend: TrendPointDto[]
  pagePerformance: Array<{
    pageId: string
    pageName: string
    avatarUrl?: string
    mediaViews: number
    contentInteractions: number
    followersCount: number
    publishedPosts: number
  }>
  topPosts: FacebookPostDto[]
}

export type FacebookOverviewSummaryDto = {
  insightsAvailable: boolean
  metrics: MetricDto[]
  contentInteractionsTrend: TrendPointDto[]
  pagePerformance: Array<Omit<FacebookOverviewDto['pagePerformance'][number], 'publishedPosts'>>
}

export type FacebookOverviewDetailsDto = {
  publishedMetric: MetricDto
  publishedPostsByPage: Array<{ pageId: string; publishedPosts: number }>
  topPosts: FacebookPostDto[]
}

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
export type FacebookPostDto = {
  id: string
  pageId: string
  pageName: string
  avatarUrl?: string
  message: string
  mediaType: 'image' | 'video' | 'link' | 'text'
  status: PostStatus
  createdAt: string
  scheduledAt?: string
  publishedAt?: string
  thumbnailUrl?: string
  mediaUrl?: string
  permalinkUrl?: string
  mediaViews: number
  reactions?: number
  comments?: number
  shares?: number
  contentInteractions: number
  clicks: number
}

export type FacebookPostsDto = {
  items: FacebookPostDto[]
  total: number
  page: number
  pageSize: number
}

export type FacebookRecentPostsQuery = FacebookQuery & {
  contentType?: 'all' | 'post' | 'reel' | 'story'
  page: number
  limit: number
  search?: string
  sortBy?:
    'publishedAt' | 'mediaViews' | 'reactions' | 'comments' | 'shares' | 'contentInteractions'
  sortOrder?: 'asc' | 'desc'
}

export type FacebookRecentPostsDto = {
  items: FacebookRecentPostDto[]
  total: number
  page: number
  limit: number
}

export type FacebookRecentPostDto = Omit<
  FacebookPostDto,
  'mediaViews' | 'reactions' | 'comments' | 'shares' | 'contentInteractions' | 'clicks'
> & {
  contentType: 'post' | 'reel' | 'story'
  mediaViews: number | null
  reactions: number | null
  comments: number | null
  shares: number | null
  contentInteractions: number | null
}

export type FacebookAnalyticsDto = {
  insightsAvailable: boolean
  metrics: MetricDto[]
  mediaViewsTrend: TrendPointDto[]
  uniqueViewersTrend: TrendPointDto[]
  contentInteractionsTrend: TrendPointDto[]
  followerGrowthTrend: TrendPointDto[]
  audience: Array<{ label: string; value: number }>
  audienceCountries: Array<{ label: string; value: number }>
  audienceCities: Array<{ label: string; value: number }>
  contentBreakdown: Array<{ label: 'images' | 'videos' | 'links' | 'text'; value: number }>
  rows: Array<{
    pageId: string
    pageName: string
    avatarUrl?: string
    mediaViews: number
    uniqueViewers: number
    contentInteractions: number
    followersCount: number
    profileViews: number
    netFollows: number
    publishedPosts: number
    engagementRate: number
  }>
  availableMetrics: string[]
  unavailableMetrics: string[]
  lastUpdatedAt: string
}

export type FacebookAnalyticsSummaryDto = {
  insightsAvailable: boolean
  metrics: MetricDto[]
  mediaViewsTrend: TrendPointDto[]
  uniqueViewersTrend: TrendPointDto[]
  contentInteractionsTrend: TrendPointDto[]
  followerGrowthTrend: TrendPointDto[]
  rows: Array<Omit<FacebookAnalyticsDto['rows'][number], 'publishedPosts'>>
  availableMetrics: string[]
  unavailableMetrics: string[]
  lastUpdatedAt: string
}

export type FacebookAnalyticsDetailsDto = {
  publishedMetric: MetricDto
  audienceCountries: Array<{ label: string; value: number }>
  audienceCities: Array<{ label: string; value: number }>
  contentBreakdown: FacebookAnalyticsDto['contentBreakdown']
  publishedPostsByPage: Array<{ pageId: string; publishedPosts: number }>
}

export type FacebookDetailsDto = FacebookAnalyticsDetailsDto & {
  topPosts: FacebookPostDto[]
}

export type FacebookQuery = {
  pageId: string
  range: DateRange
  since?: string
  until?: string
  compare: string
}

export type FacebookPostQuery = {
  pageId: string
  status: string
  keyword: string
  page: number
}

export type ConnectFacebookInput = { brandId: string }
export type FacebookOAuthStartDto = { authorizationUrl: string }
export type FacebookAvailablePageDto = {
  id: string
  name: string
  tasks: string[]
  avatarUrl?: string
  isConnected: boolean
}
export type SelectFacebookPagesInput = {
  brandId: string
  connectionId: string
  pageIds: string[]
}

export type FacebookPageActionInput = { brandId: string; pageId: string }
export type CreateFacebookPostInput = {
  brandId: string
  pageIds: string[]
  message: string
  publishNow: boolean
  scheduledAt?: string
}

export type FacebookSyncStatusDto = {
  syncing: boolean
  /** Oldest successful sync across the Brand's Pages; null until every Page has synced once. */
  lastSyncedAt: string | null
  refreshAvailableAt: string | null
  pages: Array<{
    pageId: string
    status: 'pending' | 'syncing' | 'idle' | 'error' | 'rate_limited'
    lastSyncedAt: string | null
    historyStartAt: string | null
    backfillCompleted: boolean
    lastErrorCode: string | null
  }>
}

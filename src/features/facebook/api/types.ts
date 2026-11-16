export type FacebookConnectionState = 'disconnected' | 'connected'
export type FacebookPageHealth =
  'connected' | 'token_expiring' | 'token_expired' | 'permission_missing' | 'disconnected'
export type FacebookTab = 'overview' | 'posts'
export type DateRange = '7d' | '28d' | '30d' | '90d'

export type FacebookPageDto = {
  id: string
  name: string
  avatarUrl?: string
  username: string
  category: string
  followersCount: number
  health: FacebookPageHealth
  /** Deadline to connect Facebook again; set while health is token_expiring. */
  reconnectBy?: string | null
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
  /**
   * Null when the previous period was 0: nothing to compare with, shown as "—". Left out when
   * comparison is off, and then nothing is shown.
   */
  change?: number | null
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

export const FACEBOOK_POST_CONTENT_TYPES = ['all', 'post', 'reel', 'story'] as const
export type FacebookPostContentType = (typeof FACEBOOK_POST_CONTENT_TYPES)[number]

export type FacebookRecentPostsQuery = FacebookQuery & {
  contentType?: FacebookPostContentType
  page: number
  limit: number
  search?: string
  sortBy?: FacebookPostSort
  sortOrder?: 'asc' | 'desc'
}

export type FacebookRecentPostsDto = {
  items: FacebookRecentPostDto[]
  total: number
  page: number
  limit: number
}

export const FACEBOOK_POST_SORTS = [
  'publishedAt',
  'mediaViews',
  'viewers',
  'reactions',
  'comments',
  'shares',
  'contentInteractions',
  'clicks',
  'linkClicks',
  'videoViews',
  'videoViewTime',
  'videoAvgTime',
  'newFollowers',
] as const
export type FacebookPostSort = (typeof FACEBOOK_POST_SORTS)[number]

/** A synced post; null means Facebook gave no figure. Times are in milliseconds. */
export type FacebookRecentPostDto = Omit<
  FacebookPostDto,
  'mediaViews' | 'reactions' | 'comments' | 'shares' | 'contentInteractions' | 'clicks'
> & {
  contentType: 'post' | 'reel' | 'story'
  mediaViews: number | null
  viewers: number | null
  reactions: number | null
  comments: number | null
  shares: number | null
  contentInteractions: number | null
  clicks: number | null
  linkClicks: number | null
  videoViews: number | null
  videoViewTimeMs: number | null
  videoAvgTimeMs: number | null
  videoLengthMs: number | null
  newFollowers: number | null
}

export type FacebookPostMedia = { type: 'image' | 'video'; imageUrl?: string }

export type FacebookPostVideoDetails = {
  organicViews?: number
  paidViews?: number
  autoplayedViews?: number
  clickedToPlayViews?: number
  soundOnViews?: number
  views15s?: number
  views60s?: number
  completeViews30s?: number
  /** Share of viewers still watching at each second, from 1 down to 0. */
  retention?: number[]
  viewsBySource?: Record<string, number>
  viewTimeByAgeGender?: Record<string, number>
  viewTimeByCountry?: Record<string, number>
  viewTimeByRegion?: Record<string, number>
  reelPlays?: number
  reelInitialPlays?: number
  reelReplays?: number
}

export type FacebookPostDetailDto = {
  post: FacebookRecentPostDto & {
    format?: 'reel' | 'video' | 'album' | 'photo' | 'text' | 'link'
    reactionTypes: Record<string, number>
    details: {
      clicksByType?: Record<string, number>
      media?: FacebookPostMedia[]
      video?: FacebookPostVideoDetails
    }
    metricsUpdatedAt: string
  }
  /** The post's running totals, one point per day since it was first synced. */
  daily: Array<{
    date: string
    mediaViews: number | null
    viewers: number | null
    interactions: number | null
    videoViews: number | null
  }>
  /** Median of the Page's other posts of the same kind in the 90 days before; null if too few. */
  typical: {
    posts: number
    mediaViews: number | null
    viewers: number | null
    interactions: number | null
  } | null
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
  pages: Array<{
    pageId: string
    name: string
    status: 'pending' | 'syncing' | 'idle' | 'error' | 'rate_limited'
    /** Consecutive failed sync runs; 0 after a success. */
    failureCount: number
    lastSyncedAt: string | null
    historyStartAt: string | null
    backfillCompleted: boolean
    lastErrorCode: string | null
    /** When this Page can be refreshed by hand; null when it can be now. */
    refreshAvailableAt: string | null
  }>
}

export type FacebookPostFormat = 'reel' | 'video' | 'album' | 'photo' | 'text' | 'link'

type DashboardKpi = { value: number; previous: number; change: number | null; series: number[] }
type DashboardSeries = { current: number[]; previous: number[] }

export type FacebookDashboardPostDto = {
  id: string
  pageId: string
  pageName: string
  message: string
  format: FacebookPostFormat
  createdAt: string
  thumbnailUrl?: string
  permalinkUrl?: string
  viewers: number
  /** Media views: Meta's "Views", counted every time the post is seen. */
  views: number
  engagements: number
  comments: number
  engagementRate: number
}

/**
 * The statistics screen. Viewers of a period are `estimated` when Meta's 7/28-day viewers do
 * not cover it exactly or several Pages are added up; rates are percentages.
 */
export type FacebookDashboardDto = {
  insightsAvailable: boolean
  period: { since: string; until: string; days: number; timeZone: string }
  kpis: {
    viewers: DashboardKpi & { estimated: boolean }
    views: DashboardKpi & { frequency: number }
    engagements: DashboardKpi
    engagementRate: DashboardKpi
    netFollows: DashboardKpi & { followers: number }
    videoViews: DashboardKpi
    followers: DashboardKpi
    posts: DashboardKpi
    pageViews: DashboardKpi
  }
  trend: {
    labels: string[]
    viewers: DashboardSeries
    views: DashboardSeries
    engagements: DashboardSeries
    videoViews: DashboardSeries
  }
  interactions: {
    reactions: number
    comments: number
    shares: number
    linkClicks: number
    reactionTypes: Array<{ type: string; value: number }>
  }
  followers: {
    labels: string[]
    follows: number[]
    unfollows: number[]
    totalFollows: number
    totalUnfollows: number
    net: number
    total: number
  }
  postingTimes: {
    /** `day` 0 = Monday … 6 = Sunday; `slot` 0–11 covers two hours each. */
    cells: Array<{ day: number; slot: number; posts: number; engagementRate: number }>
    best: { day: number; slot: number } | null
  }
  audience: {
    /** Share of followers in percent; `other` groups the rest. */
    countries: Array<{ label: string; value: number }>
    cities: Array<{ label: string; value: number }>
  }
  formats: Array<{
    format: FacebookPostFormat
    posts: number
    averageViewers: number
    engagementRate: number
  }>
  /** Stories published in the period: counted only, their figures are not synced. */
  formatStories: number
  pages: Array<{
    pageId: string
    pageName: string
    avatarUrl?: string
    followers: number
    netFollows: number
    viewers: number
    viewersChange: number | null
    engagements: number
    engagementRate: number
    posts: number
    pageViews: number
    viewersSeries: number[]
  }>
  topPosts: {
    viewers: FacebookDashboardPostDto[]
    engagements: FacebookDashboardPostDto[]
    engagementRate: FacebookDashboardPostDto[]
  }
}

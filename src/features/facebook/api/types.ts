export type FacebookConnectionState = 'disconnected' | 'connected' | 'needs_page_selection'
export type FacebookPageHealth =
  'connected' | 'token_expiring' | 'permission_missing' | 'disconnected'
export type FacebookTab = 'overview' | 'posts' | 'analytics'
export type DateRange = '7d' | '30d' | '90d'

export type FacebookPageDto = {
  id: string
  name: string
  handle: string
  category: string
  followers: number
  health: FacebookPageHealth
  lastSyncedAt: string
}

export type FacebookIntegrationDto = {
  state: FacebookConnectionState
  connectedBy?: string
  connectedAt?: string
  pages: FacebookPageDto[]
}

export type ManageableFacebookPageDto = FacebookPageDto & { selected: boolean }

export type MetricDto = {
  key: 'reach' | 'impressions' | 'engagement' | 'followers' | 'published'
  value: number
  change: number
}

export type TrendPointDto = { label: string; primary: number; comparison: number }

export type FacebookOverviewDto = {
  metrics: MetricDto[]
  trend: TrendPointDto[]
  pagePerformance: Array<{
    pageId: string
    pageName: string
    reach: number
    engagement: number
    followers: number
    posts: number
  }>
  topPosts: FacebookPostDto[]
  publishingHealth: { published: number; scheduled: number; failed: number }
}

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
export type FacebookPostDto = {
  id: string
  pageId: string
  pageName: string
  caption: string
  mediaType: 'image' | 'video' | 'text'
  status: PostStatus
  publishedAt: string
  reach: number
  engagement: number
  clicks: number
}

export type FacebookPostsDto = {
  items: FacebookPostDto[]
  total: number
  page: number
  pageSize: number
}

export type FacebookAnalyticsDto = {
  metrics: MetricDto[]
  reachTrend: TrendPointDto[]
  engagementTrend: TrendPointDto[]
  audience: Array<{ label: string; value: number }>
  contentBreakdown: Array<{ label: 'images' | 'videos' | 'text'; value: number }>
  rows: Array<{
    pageId: string
    pageName: string
    reach: number
    impressions: number
    engagementRate: number
    followers: number
  }>
  availability: Array<{
    metric: 'reach' | 'impressions' | 'videoRetention' | 'audienceCity'
    available: boolean
    reason?: 'advancedPermission' | 'smallAudience'
  }>
}

export type FacebookQuery = {
  pageId: string
  range: DateRange
  compare: string
}

export type FacebookPostQuery = FacebookQuery & {
  status: string
  keyword: string
  page: number
}

export type ConnectFacebookInput = { brandId: string }
export type SelectFacebookPagesInput = { brandId: string; pageIds: string[] }
export type FacebookPageActionInput = { brandId: string; pageId: string }
export type CreateFacebookPostInput = {
  brandId: string
  pageIds: string[]
  caption: string
  publishNow: boolean
}

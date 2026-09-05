export type FacebookConnectionState = 'disconnected' | 'connected'
export type FacebookPageHealth =
  'connected' | 'token_expiring' | 'permission_missing' | 'disconnected'
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
  'mediaViews' | 'uniqueViewers' | 'contentInteractions' | 'followers' | 'published'

export type MetricDto = {
  key: MetricKey
  value: number
  change: number
  estimated?: boolean
}

export type TrendPointDto = { label: string; primary: number; comparison: number }

export type FacebookOverviewDto = {
  metrics: MetricDto[]
  mediaViewsTrend: TrendPointDto[]
  pagePerformance: Array<{
    pageId: string
    pageName: string
    mediaViews: number
    uniqueViewers: number
    contentInteractions: number
    followersCount: number
    publishedPosts: number
  }>
  topPosts: FacebookPostDto[]
}

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
export type FacebookPostDto = {
  id: string
  pageId: string
  pageName: string
  message: string
  mediaType: 'image' | 'video' | 'text'
  status: PostStatus
  createdAt: string
  scheduledAt?: string
  publishedAt?: string
  mediaViews: number
  contentInteractions: number
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
  mediaViewsTrend: TrendPointDto[]
  contentInteractionsTrend: TrendPointDto[]
  audience: Array<{ label: string; value: number }>
  contentBreakdown: Array<{ label: 'images' | 'videos' | 'text'; value: number }>
  rows: Array<{
    pageId: string
    pageName: string
    mediaViews: number
    uniqueViewers: number
    contentInteractions: number
    followersCount: number
  }>
}

export type FacebookQuery = {
  pageId: string
  range: DateRange
  compare: string
}

export type FacebookPostQuery = {
  pageId: string
  status: string
  keyword: string
  page: number
}

export type ConnectFacebookInput = { brandId: string }

export type FacebookPageActionInput = { brandId: string; pageId: string }
export type CreateFacebookPostInput = {
  brandId: string
  pageIds: string[]
  message: string
  publishNow: boolean
  scheduledAt?: string
}

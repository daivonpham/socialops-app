export type TikTokAccountHealth =
  'connected' | 'token_expiring' | 'permission_missing' | 'reconnect_required'

export type TikTokSyncDto = {
  status: 'pending' | 'syncing' | 'idle' | 'failed' | 'paused'
  lastSyncedAt: string | null
  /** Figures exist from this moment: TikTok keeps no history SocialOps can read back. */
  historyStartAt: string | null
  lastErrorCode: string | null
  failureCount: number
}

/** A connected TikTok account with every profile field TikTok returns. */
export type TikTokAccountDto = {
  id: string
  providerAccountId: string
  name: string
  status: string
  health: TikTokAccountHealth
  avatarUrl?: string
  avatarLargeUrl?: string
  username?: string
  bioDescription?: string
  profileDeepLink?: string
  isVerified: boolean
  followerCount?: number
  followingCount?: number
  likesCount?: number
  videoCount?: number
  scopes: string[]
  missingScopes: string[]
  canUploadDrafts: boolean
  refreshExpiresAt: string | null
  connectedAt: string
  sync: TikTokSyncDto
}

export type TikTokIntegrationDto = {
  state: 'connected' | 'disconnected'
  accounts: TikTokAccountDto[]
  publishingEnabled: boolean
  requiredScopes: string[]
  optionalScopes: string[]
}

export const TIKTOK_PRIVACY_LEVELS = [
  'PUBLIC_TO_EVERYONE',
  'MUTUAL_FOLLOW_FRIENDS',
  'FOLLOWER_OF_CREATOR',
  'SELF_ONLY',
] as const
export type TikTokPrivacyLevel = (typeof TIKTOK_PRIVACY_LEVELS)[number]

export type TikTokCreatorInfoDto = {
  accountId: string
  creatorAvatarUrl?: string
  creatorUsername?: string
  creatorNickname?: string
  privacyLevelOptions: TikTokPrivacyLevel[]
  commentDisabled: boolean
  duetDisabled: boolean
  stitchDisabled: boolean
  maxVideoPostDurationSec: number
  canUploadDrafts: boolean
}

export type TikTokRange = '7d' | '28d' | '30d' | '90d'

export type TikTokQuery = {
  accountId: string
  range: TikTokRange
  since?: string
  until?: string
  compare: string
}

type Kpi = { value: number; previous: number; change: number | null; series: number[] }
type Series = { current: number[]; previous: number[] }

export const TIKTOK_DURATION_BUCKETS = ['under15', 'under60', 'under180', 'over180'] as const
export type TikTokDurationBucket = (typeof TIKTOK_DURATION_BUCKETS)[number]

export type TikTokDashboardVideoDto = {
  id: string
  accountId: string
  accountName: string
  title: string
  coverImageUrl?: string
  shareUrl?: string
  createdAt: string
  duration?: number
  views: number
  likes: number
  comments: number
  shares: number
  engagements: number
  engagementRate: number
}

export type TikTokDashboardDto = {
  period: { since: string; until: string; days: number; timeZone: string }
  historyStartAt: string | null
  kpis: {
    views: Kpi
    likes: Kpi
    comments: Kpi
    shares: Kpi
    engagements: Kpi
    engagementRate: Kpi
    followers: Kpi
    netFollowers: Kpi
    videos: Kpi
    totalLikes: Kpi
    following: Kpi
  }
  trend: {
    labels: string[]
    views: Series
    engagements: Series
    likes: Series
    comments: Series
    shares: Series
  }
  interactions: { likes: number; comments: number; shares: number }
  followers: { labels: string[]; net: number[]; totals: number[]; total: number; change: number }
  postingTimes: {
    cells: Array<{ day: number; slot: number; videos: number; engagementRate: number }>
    best: { day: number; slot: number } | null
  }
  durations: Array<{
    bucket: TikTokDurationBucket
    videos: number
    averageViews: number
    engagementRate: number
  }>
  accounts: Array<{
    accountId: string
    name: string
    username?: string
    avatarUrl?: string
    followers: number
    netFollowers: number
    views: number
    viewsChange: number | null
    engagements: number
    engagementRate: number
    videos: number
    viewsSeries: number[]
  }>
  topVideos: {
    views: TikTokDashboardVideoDto[]
    engagements: TikTokDashboardVideoDto[]
    engagementRate: TikTokDashboardVideoDto[]
  }
}

export const TIKTOK_VIDEO_SORTS = [
  'createdTime',
  'views',
  'likes',
  'comments',
  'shares',
  'engagementRate',
  'duration',
] as const
export type TikTokVideoSort = (typeof TIKTOK_VIDEO_SORTS)[number]

export type TikTokVideoItemDto = {
  id: string
  accountId: string
  accountName: string
  accountUsername?: string
  accountAvatarUrl?: string
  title?: string
  description?: string
  coverImageUrl?: string
  shareUrl?: string
  createdAt: string
  duration?: number
  isAigc: boolean
  orientation?: 'portrait' | 'landscape' | 'square'
  views: number
  likes: number
  comments: number
  shares: number
  engagements: number
  engagementRate: number
}

export type TikTokVideosQuery = TikTokQuery & {
  search?: string
  sortBy: TikTokVideoSort
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

export type TikTokVideosDto = {
  items: TikTokVideoItemDto[]
  total: number
  page: number
  limit: number
}

export type TikTokVideoDetailDto = {
  video: TikTokVideoItemDto
  embedHtml?: string
  embedLink?: string
  width?: number
  height?: number
  firstSeenAt: string
  lastSyncedAt: string
  /** No longer in the account's public videos: deleted or made private. */
  removed: boolean
  series: Array<{
    date: string
    views: number
    likes: number
    comments: number
    shares: number
    totalViews: number
  }>
  accountAverage: {
    videos: number
    views: number
    likes: number
    comments: number
    shares: number
  } | null
}

export type ReportTemplate =
  'period_overview' | 'page_performance' | 'content_performance' | 'publishing_activity'
export type ReportSectionId =
  | 'kpis'
  | 'trends'
  | 'daily_table'
  | 'pages_table'
  | 'top_pages'
  | 'audience'
  | 'content_mix'
  | 'posts_table'
  | 'top_posts'
  | 'bottom_posts'
  | 'best_times'
  | 'publishing_summary'
  | 'publishing_table'
export type ReportConfig = {
  schemaVersion: 1
  template: ReportTemplate
  pageIds: 'all' | string[]
  period:
    | { preset: '7d' | '30d' | '90d' | 'this_month' | 'last_month' }
    | { preset: 'custom'; since: string; until: string }
  compare: boolean
  sections: Array<{ id: ReportSectionId; enabled: boolean }>
  kpiMetrics: ReportMetricId[]
  trendMetrics: DailyMetricId[]
  contentFilter?: { types: Array<'post' | 'reel' | 'story'>; sortBy: 'views' | 'interactions' }
}
export type ReportMetricId =
  | 'mediaViews'
  | 'uniqueViewers'
  | 'engagements'
  | 'engagementRate'
  | 'pageViews'
  | 'follows'
  | 'unfollows'
  | 'netFollows'
  | 'followersStart'
  | 'followersEnd'
  | 'followerGrowthPct'
  | 'posts'
  | 'postInteractions'
  | 'reactions'
  | 'comments'
  | 'shares'
export type DailyMetricId =
  | 'mediaViews'
  | 'uniqueViewers'
  | 'engagements'
  | 'pageViews'
  | 'follows'
  | 'unfollows'
  | 'netFollows'
  | 'posts'
export type SavedReport = {
  id: string
  brandId: string
  name: string
  description: string | null
  config: ReportConfig
  version: number
  createdAt: string
  updatedAt: string
}
export type ReportDocument = {
  meta: {
    title: string
    template: ReportTemplate
    brand: { id: string; name: string }
    timeZone: string
    period: { since: string; until: string; days: number }
    previousPeriod: { since: string; until: string } | null
    generatedAt: string
    pages: Array<{ id: string; name: string; avatarUrl?: string }>
  }
  freshness: {
    lastSyncedAt: string | null
    postsMetricsUpdatedBefore: string | null
    stalePosts: number
    missingRanges: Array<{ pageId: string; since: string; until: string }>
    activeRefresh: { id: string; progress: number } | null
  }
  notes: string[]
  sections: ReportSection[]
  /** Preview only: the tables an export contains, with the same columns and formats. */
  tables?: ReportTable[]
}

export type ReportCellFormat =
  | 'text'
  | 'number'
  | 'percent'
  | 'date'
  | 'datetime'
  | 'url'
  /** ISO country code; shown with its flag and localized name. */
  | 'country'
export type ReportTable = {
  kind: string
  name: string
  columns: string[]
  formats: ReportCellFormat[]
  rowFormats?: ReportCellFormat[][]
  rows: Array<Array<string | number | null>>
  /** Rows in the full export when the preview carries only the first page. */
  totalRows?: number
}
export type ReportsList = { items: SavedReport[]; total: number; page: number; limit: number }
export type ReportRefresh = {
  id: string
  kind: 'refresh_posts' | 'backfill'
  status: 'queued' | 'running' | 'completed' | 'failed' | 'partial'
  totalUnits: number
  doneUnits: number
  errorCode: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
}

export type ReportPost = {
  id: string
  pageId: string
  pageName: string
  type: 'post' | 'reel' | 'story'
  message: string
  publishedAt: string
  views: number | null
  mediaType: 'image' | 'video' | 'link' | 'text'
  reactions: number | null
  comments: number | null
  shares: number | null
  interactions: number | null
  engagementRate: number | null
  metricsUpdatedAt: string
  permalinkUrl: string | null
}
export type ReportPublication = {
  id: string
  pageId: string
  pageName: string
  caption: string
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  errorCode: string | null
}
export type ReportSection =
  | {
      id: 'kpis'
      items: Array<{
        metric: ReportMetricId
        value: number | null
        previous: number | null
        changePct: number | null
      }>
    }
  | {
      id: 'trends'
      lines: Array<{
        metric: DailyMetricId
        series: Array<{ date: string; value: number | null; previous: number | null }>
      }>
    }
  | {
      id: 'daily_table'
      rows: Array<{ date: string; metrics: Partial<Record<ReportMetricId, number | null>> }>
    }
  | {
      id: 'pages_table'
      rows: Array<{ pageId: string; metrics: Partial<Record<ReportMetricId, number | null>> }>
      total: Partial<Record<ReportMetricId, number | null>>
    }
  | {
      id: 'top_pages'
      metric: ReportMetricId
      rows: Array<{ pageId: string; value: number; share: number }>
    }
  | {
      id: 'audience'
      countries: Array<{ code: string; value: number }>
      cities: Array<{ name: string; value: number }>
    }
  | {
      id: 'content_mix'
      byType: Array<{
        type: 'post' | 'reel' | 'story'
        posts: number
        views: number | null
        interactions: number | null
        engagementRate: number | null
      }>
      byMedia: Array<{
        type: 'image' | 'video' | 'link' | 'text'
        posts: number
        views: number | null
        interactions: number | null
      }>
    }
  | { id: 'posts_table'; rows: ReportPost[]; total: number }
  | { id: 'top_posts' | 'bottom_posts'; sortBy: 'views' | 'interactions'; rows: ReportPost[] }
  | {
      id: 'best_times'
      cells: Array<{ weekday: number; hour: number; posts: number; avgInteractions: number | null }>
    }
  | {
      id: 'publishing_summary'
      published: number
      scheduled: number
      failed: number
      needsAction: number
      inProgress: number
      drafts: number
      pendingApproval: number
    }
  | { id: 'publishing_table'; rows: ReportPublication[]; total: number }

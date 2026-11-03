import type {
  DailyMetricId,
  ReportConfig,
  ReportMetricId,
  ReportSectionId,
  ReportTemplate,
} from '../api/types'

export const REPORT_METRIC_IDS: ReportMetricId[] = [
  'mediaViews',
  'uniqueViewers',
  'engagements',
  'engagementRate',
  'pageViews',
  'follows',
  'unfollows',
  'netFollows',
  'followersStart',
  'followersEnd',
  'followerGrowthPct',
  'posts',
  'postInteractions',
  'reactions',
  'comments',
  'shares',
]
export const DAILY_METRICS: DailyMetricId[] = [
  'mediaViews',
  'uniqueViewers',
  'engagements',
  'pageViews',
  'follows',
  'unfollows',
  'netFollows',
  'posts',
]
export const DEFAULT_KPI_METRICS: ReportMetricId[] = [
  'mediaViews',
  'uniqueViewers',
  'engagements',
  'engagementRate',
  'followersEnd',
  'netFollows',
  'pageViews',
  'posts',
]
export const DEFAULT_TREND_METRICS: DailyMetricId[] = [
  'mediaViews',
  'uniqueViewers',
  'engagements',
  'netFollows',
]
export const REPORT_SECTION_IDS: ReportSectionId[] = [
  'kpis',
  'trends',
  'daily_table',
  'pages_table',
  'top_pages',
  'audience',
  'content_mix',
  'top_posts',
  'bottom_posts',
  'posts_table',
  'best_times',
  'publishing_summary',
  'publishing_table',
]

export const REPORT_TEMPLATES: Record<ReportTemplate, ReportSectionId[]> = {
  period_overview: [
    'kpis',
    'trends',
    'pages_table',
    'top_posts',
    'content_mix',
    'audience',
    'publishing_summary',
  ],
  page_performance: ['kpis', 'pages_table', 'top_pages', 'trends', 'daily_table', 'audience'],
  content_performance: [
    'kpis',
    'content_mix',
    'top_posts',
    'bottom_posts',
    'posts_table',
    'best_times',
  ],
  publishing_activity: ['publishing_summary', 'publishing_table', 'trends', 'posts_table'],
}

export function defaultReportConfig(template: ReportTemplate): ReportConfig {
  return {
    schemaVersion: 1,
    template,
    pageIds: 'all',
    period: { preset: '30d' },
    compare: true,
    sections: [
      ...REPORT_TEMPLATES[template].map((id) => ({ id, enabled: true })),
      ...REPORT_SECTION_IDS.filter((id) => !REPORT_TEMPLATES[template].includes(id)).map((id) => ({
        id,
        enabled: false,
      })),
    ],
    kpiMetrics: [...DEFAULT_KPI_METRICS],
    trendMetrics: [...DEFAULT_TREND_METRICS],
  }
}

/** Older saved reports may not contain sections and metric choices added later. */
export function hydrateReportConfig(config: ReportConfig): ReportConfig {
  const defaults = defaultReportConfig(config.template)
  const seen = new Set<ReportSectionId>()
  const sections = config.sections
    .map((section) => ({
      ...section,
      id: (section.id as string) === 'trend' ? ('trends' as const) : section.id,
    }))
    .filter((section) => {
      if (seen.has(section.id)) return false
      seen.add(section.id)
      return true
    })
  return {
    ...defaults,
    ...config,
    sections: [
      ...sections,
      ...defaults.sections
        .filter((section) => !seen.has(section.id))
        .map((section) => ({ ...section, enabled: false })),
    ],
    kpiMetrics: config.kpiMetrics ?? defaults.kpiMetrics,
    trendMetrics: config.trendMetrics ?? defaults.trendMetrics,
  }
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

/**
 * A new report's starting point from its link, so another screen can open the builder on what
 * it was showing: `template`, `since` + `until` and `pageId`. Anything invalid is ignored.
 */
export function reportConfigFromSearch(search: URLSearchParams): ReportConfig {
  const template = search.get('template')
  const config = defaultReportConfig(
    template && template in REPORT_TEMPLATES ? (template as ReportTemplate) : 'period_overview',
  )
  const since = search.get('since')
  const until = search.get('until')
  const pageId = search.get('pageId')
  return {
    ...config,
    ...(since && until && DATE_KEY.test(since) && DATE_KEY.test(until) && since <= until
      ? { period: { preset: 'custom' as const, since, until } }
      : {}),
    ...(pageId && pageId !== 'all' ? { pageIds: [pageId] } : {}),
    ...(search.get('compare') === 'none' ? { compare: false } : {}),
  }
}

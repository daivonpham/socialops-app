import { useTranslation } from 'react-i18next'
import { SectionError, Spin } from '@/shared/ui'
import {
  useFacebookDashboard,
  type FacebookDashboardDto,
  type FacebookPageDto,
  type FacebookQuery,
  type MetricDto,
} from '../../api'
import { AudienceCard } from './AudienceCard'
import { ContentTrendCard } from './ContentTrendCard'
import { FollowerGrowthCard } from './FollowerGrowthCard'
import { FormatPerformanceCard } from './FormatPerformanceCard'
import { HighlightsCard } from './HighlightsCard'
import { InteractionMixCard } from './InteractionMixCard'
import { MetricCards } from '../FacebookVisuals'
import { PagePerformanceCard } from './PagePerformanceCard'
import { PostingTimesCard } from './PostingTimesCard'
import { TopPostsCard } from './TopPostsCard'

/** The Facebook statistics overview: KPIs, trends, audience, formats, Pages and top posts. */
export function FacebookDashboard({
  brandId,
  query,
  pages,
  onSelectPage,
}: {
  brandId: string
  query: FacebookQuery
  pages: FacebookPageDto[]
  onSelectPage: (pageId: string) => void
}) {
  const { t } = useTranslation('facebook')
  const dashboard = useFacebookDashboard(brandId, query)
  const compare = query.compare === 'previous'

  if (dashboard.isPending)
    return (
      <div role="status" aria-label={t('common.loading')} className="flex justify-center py-16">
        <Spin size="lg" />
      </div>
    )
  if (dashboard.isError || !dashboard.data)
    return (
      <SectionError
        title={t('common.loadError')}
        retryLabel={t('common.retry')}
        onRetry={() => void dashboard.refetch()}
      />
    )

  const data = dashboard.data

  return (
    <div
      className={`grid gap-4 transition-opacity duration-fast ${dashboard.isPlaceholderData ? 'opacity-60' : ''}`}
      aria-busy={dashboard.isPlaceholderData}
    >
      <MetricCards
        metrics={dashboardMetrics(data, compare)}
        estimatedHint={t('dashboard.estimatedHint')}
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <ContentTrendCard className="xl:col-span-2" dashboard={data} compare={compare} />
        <InteractionMixCard interactions={data.interactions} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <FollowerGrowthCard followers={data.followers} />
        <PostingTimesCard postingTimes={data.postingTimes} />
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <AudienceCard className="xl:col-span-3" audience={data.audience} />
        <FormatPerformanceCard className="xl:col-span-2" formats={data.formats} />
      </div>
      {query.pageId === 'all' && data.pages.length > 1 ? (
        <PagePerformanceCard
          rows={data.pages}
          pages={pages}
          compare={compare}
          onSelectPage={onSelectPage}
        />
      ) : null}
      <div className="grid gap-4 xl:grid-cols-3">
        <TopPostsCard className="xl:col-span-2" topPosts={data.topPosts} />
        <HighlightsCard dashboard={data} compare={compare} pageId={query.pageId} />
      </div>
    </div>
  )
}

/** The dashboard KPIs as the metric cards shared with the analytics tab. */
function dashboardMetrics(data: FacebookDashboardDto, compare: boolean): MetricDto[] {
  const { kpis } = data
  const metric = (
    key: MetricDto['key'],
    kpi: { value: number; change: number },
    extra: Partial<MetricDto> = {},
  ): MetricDto => ({ key, value: kpi.value, change: compare ? kpi.change : 0, ...extra })
  return [
    metric('mediaViews', kpis.views),
    metric('uniqueViewers', kpis.viewers, { estimated: kpis.viewers.estimated }),
    metric('contentInteractions', kpis.engagements),
    metric('followers', kpis.followers),
    metric('published', kpis.posts),
    metric('profileViews', kpis.pageViews),
    metric('netFollows', kpis.netFollows),
    metric('engagementRate', kpis.engagementRate, { unit: 'percent' }),
  ]
}

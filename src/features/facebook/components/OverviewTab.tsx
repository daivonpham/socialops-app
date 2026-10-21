import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Avatar,
  Card,
  DataTable,
  SectionError,
  SectionSkeleton,
  type DataTableColumn,
} from '@/shared/ui'
import {
  useFacebookDetails,
  useFacebookOverviewSummary,
  type FacebookOverviewSummaryDto,
  type FacebookQuery,
} from '../api'
import { MetricCards, TrendChart } from './FacebookVisuals'
import { FacebookRecentPosts } from './FacebookRecentPosts'

type PageRow = FacebookOverviewSummaryDto['pagePerformance'][number] & { publishedPosts: number }

export function OverviewTab({ brandId, query }: { brandId: string; query: FacebookQuery }) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const summary = useFacebookOverviewSummary(brandId, query)
  const details = useFacebookDetails(brandId, query)
  const columns = useMemo<DataTableColumn<PageRow>[]>(
    () => [
      {
        key: 'pageName',
        dataIndex: 'pageName',
        title: t('overview.pageName'),
        width: 'wide',
        render: (_, row) => (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar name={row.pageName} src={row.avatarUrl} size="sm" />
            <span className="truncate text-label-md text-text-primary">{row.pageName}</span>
          </span>
        ),
      },
      numberColumn('mediaViews', t('overview.mediaViews'), locale),
      numberColumn('contentInteractions', t('overview.contentInteractions'), locale),
      numberColumn('followersCount', t('overview.followers'), locale),
      numberColumn('publishedPosts', t('overview.posts'), locale),
    ],
    [locale, t],
  )

  if (summary.isPending)
    return (
      <div className="grid gap-6">
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={6} />
      </div>
    )
  if (summary.isError)
    return (
      <SectionError
        title={t('common.loadError')}
        retryLabel={t('common.retry')}
        onRetry={() => void summary.refetch()}
      />
    )

  const data = summary.data
  if (!data) return null
  const publishedByPage = new Map(
    details.data?.publishedPostsByPage.map((item) => [item.pageId, item.publishedPosts]) ?? [],
  )
  const pagePerformance = data.pagePerformance.map((row) => ({
    ...row,
    publishedPosts: publishedByPage.get(row.pageId) ?? 0,
  }))
  const metrics = details.data ? [...data.metrics, details.data.publishedMetric] : data.metrics
  return (
    <div className="grid gap-6">
      <MetricCards metrics={metrics} />

      <Card title={t('overview.interactionsTrendTitle')}>
        <div className="p-5">
          <TrendChart
            ariaLabel={t('overview.interactionsTrendTitle')}
            points={data.contentInteractionsTrend}
            currentLabel={t('overview.current')}
            comparisonLabel={query.compare === 'previous' ? t('overview.comparison') : undefined}
          />
        </div>
      </Card>

      {details.isPending ? <SectionSkeleton rows={4} /> : null}
      {details.isError ? (
        <SectionError
          title={t('common.loadError')}
          retryLabel={t('common.retry')}
          onRetry={() => void details.refetch()}
        />
      ) : null}

      {query.pageId === 'all' && details.data ? (
        <Card title={t('overview.pagePerformance')} background="white">
          <DataTable data={pagePerformance} columns={columns} getRowId={(row) => row.pageId} />
        </Card>
      ) : null}

      <FacebookRecentPosts brandId={brandId} query={query} />
    </div>
  )
}

function numberColumn(
  key: keyof PageRow,
  title: string,
  locale: AppLocale,
): DataTableColumn<PageRow> {
  return {
    key: String(key),
    dataIndex: key,
    title,
    width: 'default',
    align: 'end',
    render: (value) => (
      <span className="text-body-sm tabular-nums text-text-primary">
        {formatNumber(Number(value), locale)}
      </span>
    ),
  }
}

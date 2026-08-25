import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Card,
  DataTable,
  EmptyState,
  IconFacebook,
  IconImage,
  SectionError,
  SectionSkeleton,
  type DataTableColumn,
} from '@/shared/ui'
import {
  useFacebookOverview,
  type FacebookOverviewDto,
  type FacebookPostDto,
  type FacebookQuery,
} from '../api'
import { MetricCards, TrendChart } from './FacebookVisuals'

type PageRow = FacebookOverviewDto['pagePerformance'][number]

export function OverviewTab({ brandId, query }: { brandId: string; query: FacebookQuery }) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const overview = useFacebookOverview(brandId, query)
  const columns = useMemo<DataTableColumn<PageRow>[]>(
    () => [
      {
        key: 'pageName',
        dataIndex: 'pageName',
        title: t('overview.pageName'),
        width: 'wide',
        sortable: true,
        render: (_, row) => (
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-50 text-platform-facebook">
              <IconFacebook />
            </span>
            <span className="truncate text-label-md text-text-primary">{row.pageName}</span>
          </span>
        ),
      },
      numberColumn('mediaViews', t('overview.mediaViews'), locale),
      numberColumn('uniqueViewers', t('overview.uniqueViewers'), locale),
      numberColumn('contentInteractions', t('overview.contentInteractions'), locale),
      numberColumn('followersCount', t('overview.followers'), locale),
      numberColumn('publishedPosts', t('overview.posts'), locale),
    ],
    [locale, t],
  )

  if (overview.isPending)
    return (
      <div className="grid gap-6">
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={6} />
      </div>
    )
  if (overview.isError)
    return (
      <SectionError
        title={t('common.loadError')}
        retryLabel={t('common.retry')}
        onRetry={() => void overview.refetch()}
      />
    )

  const data = overview.data
  if (!data) return null
  if (!data.metrics.length)
    return (
      <EmptyState title={t('overview.noDataTitle')} description={t('overview.noDataDescription')} />
    )

  return (
    <div className="grid gap-6">
      <MetricCards metrics={data.metrics} />

      <Card title={t('overview.trendTitle')}>
        <div className="p-5">
          <TrendChart
            ariaLabel={t('overview.trendTitle')}
            points={data.mediaViewsTrend}
            currentLabel={t('overview.current')}
            comparisonLabel={query.compare === 'previous' ? t('overview.comparison') : undefined}
          />
        </div>
      </Card>

      <Card title={t('overview.pagePerformance')} background="white">
        <DataTable data={data.pagePerformance} columns={columns} getRowId={(row) => row.pageId} />
      </Card>

      <Card title={t('overview.topPosts')}>
        <div className="divide-y divide-border-subtle">
          {data.topPosts.map((post, index) => (
            <TopPost key={post.id} post={post} rank={index + 1} locale={locale} />
          ))}
        </div>
      </Card>
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
    sortable: true,
    render: (value) => (
      <span className="text-body-sm tabular-nums text-text-primary">
        {formatNumber(Number(value), locale)}
      </span>
    ),
  }
}

function TopPost({
  post,
  rank,
  locale,
}: {
  post: FacebookPostDto
  rank: number
  locale: AppLocale
}) {
  const { t } = useTranslation('facebook')
  return (
    <article className="grid gap-4 px-5 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex items-center gap-3">
        <span className="w-5 text-center text-label-sm tabular-nums text-text-tertiary">
          {rank}
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-surface-muted text-text-tertiary">
          <IconImage />
        </span>
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-body-sm text-text-primary">{post.message}</p>
        <p className="mt-1 flex items-center gap-2 text-caption text-text-tertiary">
          <IconFacebook className="text-platform-facebook" />
          {post.pageName}
        </p>
      </div>
      <div className="flex gap-6 ps-8 sm:ps-0">
        <MetricValue
          label={t('overview.mediaViews')}
          value={formatNumber(post.mediaViews, locale)}
        />
        <MetricValue
          label={t('overview.contentInteractions')}
          value={formatNumber(post.contentInteractions, locale)}
        />
      </div>
    </article>
  )
}

function MetricValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-end">
      <strong className="block text-label-md tabular-nums text-text-primary">{value}</strong>
      <span className="text-caption text-text-tertiary">{label}</span>
    </div>
  )
}

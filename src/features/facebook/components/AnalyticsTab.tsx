import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCountryLabel, formatNumber, type AppLocale } from '@/shared/i18n'
import { hasPermission, usePermissions } from '@/shared/permissions'
import {
  Avatar,
  Card,
  DataTable,
  EmptyState,
  IconInfo,
  SectionError,
  SectionSkeleton,
  type DataTableColumn,
} from '@/shared/ui'
import {
  useFacebookDetails,
  useFacebookAnalyticsSummary,
  type FacebookAnalyticsSummaryDto,
  type FacebookQuery,
} from '../api'
import { FACEBOOK_ACCESS } from '../config/facebook-access'
import { BarBreakdown, MetricCards, RankedBreakdown, TrendChart } from './FacebookVisuals'

type AnalyticsRow = FacebookAnalyticsSummaryDto['rows'][number] & { publishedPosts: number }

export function AnalyticsTab({ brandId, query }: { brandId: string; query: FacebookQuery }) {
  const { t, i18n } = useTranslation('facebook')
  const { granted } = usePermissions()
  const locale = i18n.resolvedLanguage as AppLocale
  const summary = useFacebookAnalyticsSummary(brandId, query)
  const details = useFacebookDetails(brandId, query)
  const canViewAnalytics = hasPermission(granted, FACEBOOK_ACCESS.analytics[0])

  const columns = useMemo<DataTableColumn<AnalyticsRow>[]>(
    () => [
      {
        key: 'pageName',
        dataIndex: 'pageName',
        title: t('overview.pageName'),
        width: 'wide',
        render: (value, row) => (
          <span className="flex items-center gap-3 text-label-md text-text-primary">
            <Avatar name={row.pageName} src={row.avatarUrl} size="sm" />
            {String(value)}
          </span>
        ),
      },
      numberColumn('mediaViews', t('overview.mediaViews'), locale),
      numberColumn('uniqueViewers', t('overview.uniqueViewers'), locale),
      numberColumn('contentInteractions', t('overview.contentInteractions'), locale),
      numberColumn('followersCount', t('overview.followers'), locale),
      numberColumn('profileViews', t('analytics.profileViews'), locale),
      numberColumn('netFollows', t('analytics.netFollows'), locale),
      numberColumn('publishedPosts', t('overview.posts'), locale),
      {
        ...numberColumn('engagementRate', t('analytics.engagementRate'), locale),
        render: (value) => (
          <span className="tabular-nums text-text-primary">
            {t('common.percentage', {
              value: formatNumber(Number(value), locale, { maximumFractionDigits: 1 }),
            })}
          </span>
        ),
      },
    ],
    [locale, t],
  )

  if (!canViewAnalytics)
    return (
      <EmptyState
        icon={<IconInfo />}
        title={t('analytics.accessDeniedTitle')}
        description={t('analytics.accessDeniedDescription')}
      />
    )
  if (summary.isPending)
    return (
      <div className="grid gap-6">
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={7} />
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
  const contentBreakdown = (details.data?.contentBreakdown ?? []).map((item) => ({
    ...item,
    label: t(`analytics.contentTypes.${item.label}`),
  }))
  const countryBreakdown = (details.data?.audienceCountries ?? []).map((item) => ({
    ...item,
    label: formatCountryLabel(item.label, locale),
  }))
  const publishedByPage = new Map(
    details.data?.publishedPostsByPage.map((item) => [item.pageId, item.publishedPosts]) ?? [],
  )
  const rows = data.rows.map((row) => ({
    ...row,
    publishedPosts: publishedByPage.get(row.pageId) ?? 0,
  }))
  const metrics = details.data
    ? [...data.metrics.slice(0, 4), details.data.publishedMetric, ...data.metrics.slice(4)]
    : data.metrics

  return (
    <div className="grid gap-6">
      <MetricCards metrics={metrics} />

      <div className="grid gap-6 xl:grid-cols-2">
        <TrendCard
          title={t('analytics.mediaViewsTrend')}
          points={data.mediaViewsTrend}
          query={query}
        />
        <TrendCard
          title={t('analytics.uniqueViewersTrend')}
          points={data.uniqueViewersTrend}
          query={query}
        />
        <Card title={t('analytics.contentInteractionsTrend')}>
          <div className="p-5">
            <TrendChart
              ariaLabel={t('analytics.contentInteractionsTrend')}
              points={data.contentInteractionsTrend}
              currentLabel={t('overview.current')}
              comparisonLabel={query.compare === 'previous' ? t('overview.comparison') : undefined}
            />
          </div>
        </Card>
        <TrendCard
          title={t('analytics.followerGrowthTrend')}
          points={data.followerGrowthTrend}
          query={query}
        />
      </div>

      {details.isPending ? <SectionSkeleton rows={6} /> : null}
      {details.isError ? (
        <SectionError
          title={t('common.loadError')}
          retryLabel={t('common.retry')}
          onRetry={() => void details.refetch()}
        />
      ) : null}

      {details.data ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <BreakdownCard
            title={t('analytics.audienceCountries')}
            items={countryBreakdown}
            emptyDescription={t('analytics.audienceUnavailable')}
          />
          <BreakdownCard
            title={t('analytics.audienceCities')}
            items={details.data.audienceCities}
            emptyDescription={t('analytics.audienceUnavailable')}
          />
          <Card title={t('analytics.contentMix')}>
            <div className="p-5">
              <BarBreakdown items={contentBreakdown} ariaLabel={t('analytics.contentMix')} />
            </div>
          </Card>
        </div>
      ) : null}

      {query.pageId === 'all' && details.data ? (
        <Card title={t('analytics.pageBreakdown')} background="white">
          <DataTable data={rows} columns={columns} getRowId={(row) => row.pageId} />
        </Card>
      ) : null}
    </div>
  )
}

function TrendCard({
  title,
  points,
  query,
}: {
  title: string
  points: FacebookAnalyticsSummaryDto['mediaViewsTrend']
  query: FacebookQuery
}) {
  const { t } = useTranslation('facebook')
  return (
    <Card title={title}>
      <div className="p-5">
        <TrendChart
          ariaLabel={title}
          points={points}
          currentLabel={t('overview.current')}
          comparisonLabel={query.compare === 'previous' ? t('overview.comparison') : undefined}
        />
      </div>
    </Card>
  )
}

function BreakdownCard({
  title,
  items,
  emptyDescription,
}: {
  title: string
  items: Array<{ label: string; value: number }>
  emptyDescription: string
}) {
  return (
    <Card title={title}>
      <div className="p-4">
        {items.length ? (
          <RankedBreakdown items={items} ariaLabel={title} />
        ) : (
          <EmptyState icon={<IconInfo />} title={title} description={emptyDescription} />
        )}
      </div>
    </Card>
  )
}

function numberColumn(
  key: keyof AnalyticsRow,
  title: string,
  locale: AppLocale,
): DataTableColumn<AnalyticsRow> {
  return {
    key: String(key),
    dataIndex: key,
    title,
    width: 'default',
    align: 'end',
    render: (value) => (
      <span className="tabular-nums text-text-primary">{formatNumber(Number(value), locale)}</span>
    ),
  }
}

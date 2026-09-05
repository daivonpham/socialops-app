import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import { hasPermission, usePermissions } from '@/shared/permissions'
import {
  Card,
  DataTable,
  EmptyState,
  IconFacebook,
  IconInfo,
  SectionError,
  SectionSkeleton,
  type DataTableColumn,
} from '@/shared/ui'
import { useFacebookAnalytics, type FacebookAnalyticsDto, type FacebookQuery } from '../api'
import { FACEBOOK_ACCESS } from '../config/facebook-access'
import { BarBreakdown, MetricCards, TrendChart } from './FacebookVisuals'

type AnalyticsRow = FacebookAnalyticsDto['rows'][number]

export function AnalyticsTab({ brandId, query }: { brandId: string; query: FacebookQuery }) {
  const { t, i18n } = useTranslation('facebook')
  const { granted } = usePermissions()
  const locale = i18n.resolvedLanguage as AppLocale
  const analytics = useFacebookAnalytics(brandId, query)

  const canViewAnalytics = hasPermission(granted, FACEBOOK_ACCESS.analytics[0])

  const columns = useMemo<DataTableColumn<AnalyticsRow>[]>(
    () => [
      {
        key: 'pageName',
        dataIndex: 'pageName',
        title: t('overview.pageName'),
        width: 'wide',
        sortable: true,
        render: (value) => (
          <span className="flex items-center gap-3 text-label-md text-text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-50 text-platform-facebook">
              <IconFacebook />
            </span>
            {String(value)}
          </span>
        ),
      },
      numberColumn('mediaViews', t('overview.mediaViews'), locale),
      numberColumn('uniqueViewers', t('overview.uniqueViewers'), locale),
      numberColumn('contentInteractions', t('overview.contentInteractions'), locale),
      numberColumn('followersCount', t('overview.followers'), locale),
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
  if (analytics.isPending)
    return (
      <div className="grid gap-6">
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={7} />
      </div>
    )
  if (analytics.isError)
    return (
      <SectionError
        title={t('common.loadError')}
        retryLabel={t('common.retry')}
        onRetry={() => void analytics.refetch()}
      />
    )

  const data = analytics.data
  if (!data) return null

  const contentBreakdown = data.contentBreakdown.map((item) => ({
    ...item,
    label: t(`analytics.contentTypes.${item.label}`),
  }))

  return (
    <div className="grid gap-6">
      <MetricCards metrics={data.metrics} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={t('analytics.mediaViewsTrend')}>
          <div className="p-5">
            <TrendChart
              ariaLabel={t('analytics.mediaViewsTrend')}
              points={data.mediaViewsTrend}
              currentLabel={t('overview.current')}
              comparisonLabel={query.compare === 'previous' ? t('overview.comparison') : undefined}
            />
          </div>
        </Card>
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
        <Card title={t('analytics.audience')}>
          <div className="p-5">
            <BarBreakdown items={data.audience} ariaLabel={t('analytics.audience')} />
          </div>
        </Card>
        <Card title={t('analytics.contentMix')}>
          <div className="p-5">
            <BarBreakdown items={contentBreakdown} ariaLabel={t('analytics.contentMix')} />
          </div>
        </Card>
      </div>

      <Card title={t('analytics.pageBreakdown')} background="white">
        <DataTable data={data.rows} columns={columns} getRowId={(row) => row.pageId} />
      </Card>
    </div>
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
    sortable: true,
    render: (value) => (
      <span className="tabular-nums text-text-primary">{formatNumber(Number(value), locale)}</span>
    ),
  }
}

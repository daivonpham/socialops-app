import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import { hasPermission, usePermissions } from '@/shared/permissions'
import {
  Alert,
  Button,
  DataTable,
  EmptyState,
  IconDownload,
  IconInfo,
  SectionError,
  SectionSkeleton,
  StatusTag,
  type DataTableColumn,
} from '@/shared/ui'
import { useFacebookAnalytics, type FacebookAnalyticsDto, type FacebookQuery } from '../api'
import { FACEBOOK_ACCESS } from '../config/facebook-access'
import { BarBreakdown, MetricCards, TrendChart } from './FacebookVisuals'

type AnalyticsRow = FacebookAnalyticsDto['rows'][number]
type AvailabilityRow = FacebookAnalyticsDto['availability'][number]

export function AnalyticsTab({ brandId, query }: { brandId: string; query: FacebookQuery }) {
  const { t, i18n } = useTranslation('facebook')
  const { granted } = usePermissions()
  const locale = i18n.resolvedLanguage as AppLocale
  const analytics = useFacebookAnalytics(brandId, query)
  const [exported, setExported] = useState(false)
  const allowed = hasPermission(granted, FACEBOOK_ACCESS.analytics[0])

  const columns = useMemo<DataTableColumn<AnalyticsRow>[]>(
    () => [
      {
        key: 'pageName',
        dataIndex: 'pageName',
        title: t('overview.pageName'),
        width: 'wide',
        sortable: true,
        render: (value) => (
          <strong className="text-label-md text-text-primary">{String(value)}</strong>
        ),
      },
      {
        key: 'reach',
        dataIndex: 'reach',
        title: t('overview.reach'),
        width: 'default',
        align: 'end',
        sortable: true,
        render: (value) => (
          <span className="tabular-nums">{formatNumber(Number(value), locale)}</span>
        ),
      },
      {
        key: 'impressions',
        dataIndex: 'impressions',
        title: t('analytics.impressions'),
        width: 'default',
        align: 'end',
        sortable: true,
        render: (value) => (
          <span className="tabular-nums">{formatNumber(Number(value), locale)}</span>
        ),
      },
      {
        key: 'engagementRate',
        dataIndex: 'engagementRate',
        title: t('analytics.engagementRate'),
        width: 'default',
        align: 'end',
        sortable: true,
        render: (value) => (
          <span className="tabular-nums">{t('common.percentage', { value: Number(value) })}</span>
        ),
      },
      {
        key: 'followers',
        dataIndex: 'followers',
        title: t('overview.followers'),
        width: 'default',
        align: 'end',
        sortable: true,
        render: (value) => (
          <span className="tabular-nums">{formatNumber(Number(value), locale)}</span>
        ),
      },
    ],
    [locale, t],
  )

  const availabilityColumns = useMemo<DataTableColumn<AvailabilityRow>[]>(
    () => [
      {
        key: 'metric',
        dataIndex: 'metric',
        title: t('analytics.metric'),
        width: 'wide',
        render: (value) => t(`analytics.availabilityMetrics.${value as AvailabilityRow['metric']}`),
      },
      {
        key: 'available',
        dataIndex: 'available',
        title: t('analytics.availability'),
        width: 'default',
        render: (value) => (
          <StatusTag tone={value ? 'success' : 'neutral'}>
            {value ? t('analytics.available') : t('common.notAvailable')}
          </StatusTag>
        ),
      },
      {
        key: 'reason',
        dataIndex: 'reason',
        title: t('analytics.reason'),
        width: 'content',
        render: (value) =>
          value
            ? t(`analytics.availabilityReasons.${value as NonNullable<AvailabilityRow['reason']>}`)
            : '—',
      },
    ],
    [t],
  )

  if (!allowed)
    return (
      <EmptyState
        icon={<IconInfo />}
        title={t('analytics.accessDeniedTitle')}
        description={t('analytics.accessDeniedDescription')}
      />
    )
  if (analytics.isPending)
    return (
      <div className="grid gap-5">
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

  const exportCsv = () => {
    const csv = [
      'Page,Reach,Impressions,Engagement rate,Followers',
      ...data.rows.map((row) =>
        [row.pageName, row.reach, row.impressions, row.engagementRate, row.followers].join(','),
      ),
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'facebook-analytics.csv'
    link.click()
    URL.revokeObjectURL(url)
    setExported(true)
  }

  const contentBreakdown = data.contentBreakdown.map((item) => ({
    ...item,
    label: t(`analytics.contentTypes.${item.label}`),
  }))

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-heading-3 text-text-primary">{t('analytics.title')}</h2>
          <p className="mt-1 text-body-sm text-text-tertiary">{t('analytics.description')}</p>
        </div>
        <Button icon={<IconDownload />} onClick={exportCsv}>
          {t('common.export')}
        </Button>
      </div>
      {exported ? (
        <Alert
          tone="success"
          title={t('analytics.exportStarted')}
          closable
          onClose={() => setExported(false)}
        />
      ) : null}
      <MetricCards metrics={data.metrics} />
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartSection title={t('analytics.reachTrend')}>
          <TrendChart
            points={data.reachTrend}
            currentLabel={t('overview.current')}
            comparisonLabel={query.compare === 'previous' ? t('overview.comparison') : undefined}
          />
        </ChartSection>
        <ChartSection title={t('analytics.engagementTrend')}>
          <TrendChart
            points={data.engagementTrend}
            currentLabel={t('overview.current')}
            comparisonLabel={query.compare === 'previous' ? t('overview.comparison') : undefined}
          />
        </ChartSection>
        <ChartSection title={t('analytics.audience')}>
          <BarBreakdown items={data.audience} />
        </ChartSection>
        <ChartSection title={t('analytics.contentMix')}>
          <BarBreakdown items={contentBreakdown} />
        </ChartSection>
      </div>
      <section>
        <h3 className="text-heading-3 text-text-primary">{t('analytics.pageBreakdown')}</h3>
        <div className="mt-4">
          <DataTable data={data.rows} columns={columns} getRowId={(row) => row.pageId} />
        </div>
      </section>
      <section className="rounded-xl border border-border-subtle bg-bg-surface p-4">
        <div className="flex gap-3">
          <IconInfo />
          <div>
            <h3 className="text-heading-4 text-text-primary">
              {t('analytics.metricAvailability')}
            </h3>
            <p className="mt-1 text-body-sm text-text-tertiary">
              {t('analytics.metricAvailabilityDescription')}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <DataTable
            data={data.availability}
            columns={availabilityColumns}
            getRowId={(row) => row.metric}
          />
        </div>
      </section>
    </div>
  )
}

function ChartSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border-subtle bg-bg-surface p-4">
      <h3 className="mb-4 text-heading-4 text-text-primary">{title}</h3>
      {children}
    </section>
  )
}

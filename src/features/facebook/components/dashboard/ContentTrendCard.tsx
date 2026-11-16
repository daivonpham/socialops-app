import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppLocale } from '@/shared/i18n'
import { AreaTrendChart, Tabs } from '@/shared/ui'
import type { FacebookDashboardDto } from '../../api'
import { ChangePill, DashboardCard } from './DashboardCard'
import { formatCompact, formatDayMonth } from './format'

const METRICS = ['viewers', 'views', 'engagements', 'videoViews'] as const
type TrendMetric = (typeof METRICS)[number]

export function ContentTrendCard({
  dashboard,
  compare,
  className,
}: {
  dashboard: FacebookDashboardDto
  compare: boolean
  className?: string
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const [metric, setMetric] = useState<TrendMetric>('viewers')
  const series = dashboard.trend[metric]
  const labels = dashboard.trend.labels
  const total = series.current.reduce((sum, value) => sum + value, 0)
  const peakIndex = series.current.reduce(
    (best, value, index, values) => (value > (values[best] ?? 0) ? index : best),
    0,
  )
  // The viewers total is the period's viewers, not the sum of daily viewers.
  const shownTotal = metric === 'viewers' ? dashboard.kpis.viewers.value : total
  const change =
    metric === 'viewers'
      ? dashboard.kpis.viewers.change
      : metric === 'views'
        ? dashboard.kpis.views.change
        : metric === 'engagements'
          ? dashboard.kpis.engagements.change
          : dashboard.kpis.videoViews.change
  const metricLabel = t(`dashboard.trend.metrics.${metric}`)
  const range = (from?: string, to?: string) =>
    from && to ? ` · ${formatDayMonth(from)} – ${formatDayMonth(to)}` : ''
  const previousLabels = labels.map((label) => shiftDay(label, -labels.length))

  return (
    <DashboardCard
      className={className}
      title={t('dashboard.trend.title')}
      description={
        metric === 'videoViews'
          ? t('dashboard.trend.videoViewsDescription')
          : t('dashboard.trend.description')
      }
      extra={
        <Tabs
          value={metric}
          ariaLabel={t('dashboard.trend.metric')}
          onChange={setMetric}
          options={METRICS.map((value) => ({
            value,
            label: t(`dashboard.trend.metrics.${value}`),
          }))}
        />
      }
    >
      <dl className="flex flex-wrap gap-x-10 gap-y-4">
        <div className="grid gap-1">
          <dt className="text-caption text-text-tertiary">
            {t('dashboard.trend.total', { metric: metricLabel.toLowerCase() })}
          </dt>
          <dd className="flex items-center gap-2">
            <span className="text-heading-1 tabular-nums text-text-primary">
              {formatCompact(shownTotal, locale)}
            </span>
            {compare ? <ChangePill change={change} locale={locale} /> : null}
          </dd>
        </div>
        <div className="grid gap-1 border-s border-border-subtle ps-5">
          <dt className="text-caption text-text-tertiary">{t('dashboard.trend.average')}</dt>
          <dd className="text-heading-3 tabular-nums text-text-primary">
            {formatCompact(labels.length ? total / labels.length : 0, locale)}
          </dd>
        </div>
        <div className="grid gap-1 border-s border-border-subtle ps-5">
          <dt className="text-caption text-text-tertiary">{t('dashboard.trend.peak')}</dt>
          <dd className="text-heading-3 tabular-nums text-text-primary">
            {labels[peakIndex]
              ? `${formatDayMonth(labels[peakIndex])} · ${formatCompact(series.current[peakIndex] ?? 0, locale)}`
              : '—'}
          </dd>
        </div>
      </dl>
      <AreaTrendChart
        ariaLabel={t('dashboard.trend.title')}
        data={labels.map((label, index) => ({
          label,
          current: series.current[index] ?? 0,
          previous: series.previous[index] ?? 0,
        }))}
        currentLabel={`${t('dashboard.currentPeriod')}${range(labels[0], labels.at(-1))}`}
        previousLabel={
          compare
            ? `${t('dashboard.previousPeriod')}${range(previousLabels[0], previousLabels.at(-1))}`
            : undefined
        }
        valueFormatter={(value) => formatCompact(value, locale)}
        labelFormatter={formatDayMonth}
      />
    </DashboardCard>
  )
}

/** `2026-10-09` moved by `days` days, as a `YYYY-MM-DD` key. */
function shiftDay(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
}

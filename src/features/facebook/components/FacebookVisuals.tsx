import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import { BarChart, IconArrowDown, IconArrowUp, LineChart } from '@/shared/ui'
import type { MetricDto, TrendPointDto } from '../api'

export function MetricCards({ metrics }: { metrics: MetricDto[] }) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => {
        const positive = metric.change >= 0
        return (
          <div
            key={metric.key}
            className="min-w-0 rounded-xl border border-border-subtle bg-bg-surface p-5"
          >
            <div className="flex items-center gap-2">
              <span className="truncate text-label-sm text-text-tertiary">
                {t(`metrics.${metric.key}`)}
              </span>
              {metric.estimated ? (
                <span className="text-caption text-text-disabled">{t('metrics.estimated')}</span>
              ) : null}
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <strong className="truncate text-heading-1 tabular-nums text-text-primary">
                {formatNumber(metric.value, locale, {
                  notation: metric.value > 9999 ? 'compact' : 'standard',
                  maximumFractionDigits: 1,
                })}
              </strong>
              <span
                className={
                  'flex shrink-0 items-center gap-1 text-label-sm ' +
                  (positive ? 'text-success-700' : 'text-error-700')
                }
              >
                {positive ? <IconArrowUp /> : <IconArrowDown />}
                <span className="tabular-nums">{Math.abs(metric.change)}%</span>
              </span>
            </div>
            <p className="mt-2 text-caption text-text-tertiary">{t('metrics.vsPrevious')}</p>
          </div>
        )
      })}
    </div>
  )
}

export function TrendChart({
  points,
  currentLabel,
  comparisonLabel,
  ariaLabel,
}: {
  points: TrendPointDto[]
  currentLabel: string
  comparisonLabel?: string
  ariaLabel: string
}) {
  const { i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const series = [
    { dataKey: 'primary', label: currentLabel, tone: 'facebook' as const },
    ...(comparisonLabel
      ? [{ dataKey: 'comparison', label: comparisonLabel, tone: 'neutral' as const, dashed: true }]
      : []),
  ]

  return (
    <LineChart
      ariaLabel={ariaLabel}
      xAxisKey="label"
      data={points}
      series={series}
      valueFormatter={(value) =>
        formatNumber(value, locale, {
          notation: value > 9999 ? 'compact' : 'standard',
          maximumFractionDigits: 1,
        })
      }
    />
  )
}

export function BarBreakdown({
  items,
  ariaLabel,
}: {
  items: Array<{ label: string; value: number }>
  ariaLabel: string
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  return (
    <BarChart
      data={items}
      ariaLabel={ariaLabel}
      domain={[0, 100]}
      valueFormatter={(value) => t('common.percentage', { value: formatNumber(value, locale) })}
    />
  )
}

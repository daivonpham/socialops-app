import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import {
  IconArrowDown,
  IconArrowUp,
  IconHeart,
  IconInfo,
  IconLike,
  IconMembers,
  IconPost,
  IconProfile,
  IconReports,
  IconView,
  LineChart,
  Tooltip,
} from '@/shared/ui'
import type { MetricDto, MetricKey, TrendPointDto } from '../api'

export function MetricCards({
  metrics,
  estimatedHint,
  hints,
}: {
  metrics: MetricDto[]
  /** Explains estimated values on hover. */
  estimatedHint?: string
  /** How a metric is worked out, behind an info icon next to its name. */
  hints?: Partial<Record<MetricKey, string>>
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        // Null: the previous period had none, so there is no change to show.
        const positive = metric.change == null || metric.change >= 0
        return (
          <div
            key={metric.key}
            className="relative flex min-w-0 items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-xs"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface-subtle text-icon-sm text-[#404040] shadow-xs">
              <MetricIcon metricKey={metric.key} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-label-sm leading-snug text-text-tertiary">
                  {t(`metrics.${metric.key}`)}
                </span>
                {hints?.[metric.key] ? (
                  <Tooltip title={hints[metric.key]}>
                    <span className="inline-flex text-caption text-text-tertiary">
                      <IconInfo aria-label={hints[metric.key]} />
                    </span>
                  </Tooltip>
                ) : null}
                {metric.estimated ? (
                  <Tooltip title={estimatedHint}>
                    <span
                      className={`text-caption text-text-disabled ${estimatedHint ? 'cursor-help underline decoration-dotted' : ''}`}
                    >
                      {t('metrics.estimated')}
                    </span>
                  </Tooltip>
                ) : null}
              </div>
              <strong className="truncate text-heading-1 tabular-nums text-text-primary">
                {metric.unit === 'percent'
                  ? t('common.percentage', {
                      value: formatNumber(metric.value, locale, { maximumFractionDigits: 1 }),
                    })
                  : formatNumber(metric.value, locale, {
                      notation: metric.value > 9999 ? 'compact' : 'standard',
                      maximumFractionDigits: 1,
                    })}
              </strong>
            </div>
            {metric.change === undefined ? null : metric.change === null ? (
              <span className="absolute bottom-4 right-4 text-label-sm text-text-tertiary">—</span>
            ) : (
              <span
                className={
                  'absolute bottom-4 right-4 flex shrink-0 items-center gap-1 text-label-sm ' +
                  (positive ? 'text-success-700' : 'text-error-700')
                }
              >
                {positive ? <IconArrowUp /> : <IconArrowDown />}
                <span className="tabular-nums">{Math.abs(metric.change)}%</span>
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MetricIcon({ metricKey }: { metricKey: MetricKey }) {
  switch (metricKey) {
    case 'mediaViews':
      return <IconView aria-hidden />
    case 'uniqueViewers':
      return <IconProfile aria-hidden />
    case 'contentInteractions':
      return <IconLike aria-hidden />
    case 'followers':
      return <IconMembers aria-hidden />
    case 'published':
      return <IconPost aria-hidden />
    case 'profileViews':
      return <IconReports aria-hidden />
    case 'netFollows':
      return <IconArrowUp aria-hidden />
    case 'engagementRate':
      return <IconHeart aria-hidden />
  }
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
    { dataKey: 'primary', label: currentLabel, tone: 'primary' as const },
    ...(comparisonLabel
      ? [
          {
            dataKey: 'comparison',
            label: comparisonLabel,
            tone: 'primary' as const,
            dashed: true,
            opacity: 0.4,
          },
        ]
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

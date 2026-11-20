import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import {
  IconArrowUp,
  IconHeart,
  IconLike,
  IconMembers,
  IconPost,
  IconProfile,
  IconReports,
  IconView,
  LineChart,
  StatCards,
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
  const { t } = useTranslation('facebook')

  return (
    <StatCards
      items={metrics.map((metric) => ({
        key: metric.key,
        label: t(`metrics.${metric.key}`),
        value: metric.value,
        change: metric.change,
        unit: metric.unit === 'percent' ? 'percent' : 'count',
        icon: <MetricIcon metricKey={metric.key} />,
        hint: hints?.[metric.key],
        note: metric.estimated ? { label: t('metrics.estimated'), hint: estimatedHint } : undefined,
      }))}
    />
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

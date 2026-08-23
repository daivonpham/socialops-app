import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import {
  BarChart,
  Card,
  IconArrowDown,
  IconArrowUp,
  LineChart,
  Statistic,
  StatusTag,
} from '@/shared/ui'
import type { MetricDto, TrendPointDto } from '../api'

export function MetricCards({ metrics }: { metrics: MetricDto[] }) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => {
        const positive = metric.change >= 0
        return (
          <Card key={metric.key}>
            <div className="flex items-end justify-between gap-3">
              <Statistic
                title={t(`metrics.${metric.key}`)}
                value={formatNumber(metric.value, locale, {
                  notation: metric.value > 9999 ? 'compact' : 'standard',
                  maximumFractionDigits: 1,
                })}
              />
              <StatusTag tone={positive ? 'success' : 'error'}>
                <span className="flex items-center gap-1">
                  {positive ? <IconArrowUp /> : <IconArrowDown />}
                  {Math.abs(metric.change)}%
                </span>
              </StatusTag>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export function TrendChart({
  points,
  currentLabel,
  comparisonLabel,
}: {
  points: TrendPointDto[]
  currentLabel: string
  comparisonLabel?: string
}) {
  const series = [
    { dataKey: 'primary', label: currentLabel, tone: 'primary' as const },
    ...(comparisonLabel
      ? [{ dataKey: 'comparison', label: comparisonLabel, tone: 'neutral' as const, dashed: true }]
      : []),
  ]
  return <LineChart ariaLabel={currentLabel} xAxisKey="label" data={points} series={series} />
}

export function BarBreakdown({ items }: { items: Array<{ label: string; value: number }> }) {
  return (
    <BarChart data={items} ariaLabel={items.map((item) => item.label).join(', ')} valueSuffix="%" />
  )
}

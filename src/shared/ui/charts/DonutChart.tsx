import type { ReactNode } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { semanticColor } from '@/shared/styles/tokens'
import { CHART_TONE, type ChartTone } from './palette'
import { CHART_TOOLTIP_STYLE } from './tooltip'

export type DonutDatum = { key: string; label: string; value: number; tone: ChartTone }

/** Share of a small set of categories, with a summary in the hole. */
export function DonutChart({
  data,
  ariaLabel,
  center,
  valueFormatter = String,
}: {
  data: readonly DonutDatum[]
  ariaLabel: string
  center?: ReactNode
  /** Tooltip text for a slice; receives its value and its share in percent. */
  valueFormatter?: (value: number, percent: number) => string
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const hasValues = data.some((item) => item.value > 0)
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[200px]"
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {hasValues ? (
            <Tooltip
              {...CHART_TOOLTIP_STYLE}
              formatter={(value, name) => [
                valueFormatter(Number(value), total ? (Number(value) / total) * 100 : 0),
                String(name),
              ]}
            />
          ) : null}
          <Pie
            data={
              hasValues ? [...data] : [{ key: 'empty', label: '', value: 1, tone: 'neutralSoft' }]
            }
            dataKey="value"
            nameKey="label"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={hasValues ? 2 : 0}
            stroke={semanticColor.bg.surface}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {(hasValues ? data : [{ key: 'empty', tone: 'neutralSoft' as const }]).map((item) => (
              <Cell key={item.key} fill={CHART_TONE[item.tone]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {center ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {center}
        </div>
      ) : null}
    </div>
  )
}

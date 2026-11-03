import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { radius, semanticColor, space } from '@/shared/styles/tokens'
import { CHART_TOOLTIP_STYLE } from './tooltip'
import { CHART_TONE } from './palette'

export type DivergingBarDatum = { label: string; positive: number; negative: number }

export type DivergingBarChartProps = {
  data: readonly DivergingBarDatum[]
  ariaLabel: string
  positiveLabel: string
  negativeLabel: string
  valueFormatter?: (value: number) => string
  labelFormatter?: (label: string) => string
}

/** Gains above the axis and losses below it, e.g. follows and unfollows per day. */
export function DivergingBarChart({
  data,
  ariaLabel,
  positiveLabel,
  negativeLabel,
  valueFormatter = String,
  labelFormatter = String,
}: DivergingBarChartProps) {
  const rows = data.map((item) => ({ ...item, negative: -Math.abs(item.negative) }))
  // Symmetric around zero so the baseline stays in the middle even when one side is empty.
  const extent = Math.max(
    1,
    ...data.map((item) => Math.max(item.positive, Math.abs(item.negative))),
  )
  return (
    <figure className="w-full">
      <div className="h-chart w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            accessibilityLayer
            data={rows}
            stackOffset="sign"
            margin={{ top: space[2], right: space[1], bottom: 0, left: space[1] }}
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              minTickGap={space[6]}
              interval="preserveStartEnd"
              tickFormatter={(value) => labelFormatter(String(value))}
              tick={{ fill: semanticColor.text.tertiary }}
            />
            <YAxis hide domain={[-extent, extent]} />
            <ReferenceLine y={0} stroke={semanticColor.border.subtle} strokeOpacity={0.6} />
            <Tooltip
              formatter={(value, name) => [valueFormatter(Math.abs(Number(value))), String(name)]}
              labelFormatter={(label) => labelFormatter(String(label))}
              cursor={{ fill: semanticColor.bg['surface-subtle'] }}
              {...CHART_TOOLTIP_STYLE}
            />
            <Bar
              dataKey="positive"
              name={positiveLabel}
              stackId="flow"
              fill={CHART_TONE.primary}
              radius={[radius.sm, radius.sm, 0, 0]}
            />
            <Bar
              dataKey="negative"
              name={negativeLabel}
              stackId="flow"
              fill={CHART_TONE.accentSoft}
              // Recharts flips the corners of negative bars, so this rounds their bottom.
              radius={[radius.sm, radius.sm, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-caption text-text-tertiary">
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2 rounded-sm bg-action-primary" />
          {positiveLabel}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2 rounded-sm bg-accent-300" />
          {negativeLabel}
        </span>
      </div>
    </figure>
  )
}

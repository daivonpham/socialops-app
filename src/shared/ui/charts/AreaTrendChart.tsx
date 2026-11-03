import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { componentToken, semanticColor, space } from '@/shared/styles/tokens'
import { CHART_TOOLTIP_STYLE } from './tooltip'
import { CHART_TONE } from './palette'

export type AreaTrendDatum = { label: string; current: number; previous?: number }

export type AreaTrendChartProps = {
  data: readonly AreaTrendDatum[]
  ariaLabel: string
  currentLabel: string
  /** Dashed comparison line; omitted when the period is not compared. */
  previousLabel?: string
  valueFormatter?: (value: number) => string
  labelFormatter?: (label: string) => string
}

/** Current period as a filled area with the previous period as a dashed line. */
export function AreaTrendChart({
  data,
  ariaLabel,
  currentLabel,
  previousLabel,
  valueFormatter = String,
  labelFormatter = String,
}: AreaTrendChartProps) {
  return (
    <figure className="w-full">
      <div className="h-chart w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            accessibilityLayer
            data={[...data]}
            margin={{ top: space[2], right: space[3], bottom: 0, left: space[1] }}
          >
            <defs>
              <linearGradient id="area-trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_TONE.primary} stopOpacity={0.22} />
                <stop offset="100%" stopColor={CHART_TONE.primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={semanticColor.border.subtle} vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              minTickGap={space[6]}
              interval="preserveStartEnd"
              tickFormatter={(value) => labelFormatter(String(value))}
              tick={{ fill: semanticColor.text.tertiary }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={space[12]}
              tickFormatter={(value) => valueFormatter(Number(value))}
              tick={{ fill: semanticColor.text.tertiary }}
            />
            <Tooltip
              formatter={(value, name) => [valueFormatter(Number(value)), String(name)]}
              labelFormatter={(label) => labelFormatter(String(label))}
              {...CHART_TOOLTIP_STYLE}
              cursor={{ stroke: semanticColor.border.DEFAULT }}
            />
            {previousLabel ? (
              <Line
                type="monotone"
                dataKey="previous"
                name={previousLabel}
                stroke={CHART_TONE.neutral}
                strokeWidth={componentToken.chart.lineWidth}
                strokeDasharray={componentToken.chart.gridDash}
                dot={false}
                activeDot={false}
              />
            ) : null}
            <Area
              type="monotone"
              dataKey="current"
              name={currentLabel}
              stroke={CHART_TONE.primary}
              strokeWidth={componentToken.chart.lineWidth}
              fill="url(#area-trend-fill)"
              activeDot={{
                r: componentToken.chart.pointRadius + componentToken.chart.lineWidth,
                fill: CHART_TONE.primary,
                stroke: semanticColor.bg.surface,
                strokeWidth: componentToken.chart.lineWidth,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-caption text-text-tertiary">
        <span className="flex items-center gap-2">
          <span aria-hidden className="block w-5 border-t-2 border-action-primary" />
          {currentLabel}
        </span>
        {previousLabel ? (
          <span className="flex items-center gap-2">
            <span aria-hidden className="block w-5 border-t-2 border-dashed border-neutral-400" />
            {previousLabel}
          </span>
        ) : null}
      </div>
    </figure>
  )
}

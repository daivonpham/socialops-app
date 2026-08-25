import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { color, componentToken, radius, semanticColor, shadow, space } from '@/shared/styles/tokens'

export type LineChartDatum = Record<string, string | number | undefined>

export type LineChartSeries = {
  dataKey: string
  label: string
  tone?: 'primary' | 'neutral' | 'facebook'
  dashed?: boolean
}

export type LineChartProps = {
  data: readonly LineChartDatum[]
  xAxisKey: string
  series: readonly LineChartSeries[]
  ariaLabel: string
  valueFormatter?: (value: number) => string
}

const STROKE_BY_TONE = {
  primary: semanticColor.action.primary,
  neutral: color.neutral[500],
  facebook: color.platform.facebook,
} as const

/** Reusable, token-driven time-series chart for operational dashboards. */
export function LineChart({ data, xAxisKey, series, ariaLabel, valueFormatter }: LineChartProps) {
  const formatValue = valueFormatter ?? ((value: number) => String(value))

  return (
    <figure className="w-full">
      <div className="mb-4 flex flex-wrap items-center gap-4" aria-hidden="true">
        {series.map((item) => (
          <span
            key={item.dataKey}
            className="flex items-center gap-2 text-label-sm text-text-secondary"
          >
            <span
              className="block w-6 border-t-2"
              style={{
                borderColor: STROKE_BY_TONE[item.tone ?? 'primary'],
                borderTopStyle: item.dashed ? 'dashed' : 'solid',
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div className="h-chart w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            accessibilityLayer
            data={[...data]}
            margin={{ top: space[2], right: space[3], bottom: 0, left: space[1] }}
          >
            <CartesianGrid stroke={semanticColor.border.subtle} vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              minTickGap={space[4]}
              interval="preserveStartEnd"
              tick={{ fill: semanticColor.text.tertiary }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={space[12]}
              tickFormatter={(value) => formatValue(Number(value))}
              tick={{ fill: semanticColor.text.tertiary }}
            />
            <Tooltip
              formatter={(value, name) => [formatValue(Number(value)), String(name)]}
              contentStyle={{
                background: semanticColor.bg.elevated,
                border: `1px solid ${semanticColor.border.DEFAULT}`,
                borderRadius: radius.lg,
                boxShadow: shadow.md,
              }}
              labelStyle={{ color: semanticColor.text.primary }}
              itemStyle={{ color: semanticColor.text.secondary }}
              cursor={{ stroke: semanticColor.border.DEFAULT }}
            />
            {series.map((item) => {
              const stroke = STROKE_BY_TONE[item.tone ?? 'primary']
              return (
                <Line
                  key={item.dataKey}
                  type="monotone"
                  dataKey={item.dataKey}
                  name={item.label}
                  stroke={stroke}
                  strokeWidth={componentToken.chart.lineWidth}
                  strokeDasharray={item.dashed ? componentToken.chart.gridDash : undefined}
                  dot={false}
                  activeDot={{
                    r: componentToken.chart.pointRadius + componentToken.chart.lineWidth,
                    fill: stroke,
                    stroke: semanticColor.bg.surface,
                    strokeWidth: componentToken.chart.lineWidth,
                  }}
                />
              )
            })}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th>{xAxisKey}</th>
            {series.map((item) => (
              <th key={item.dataKey}>{item.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((point, index) => (
            <tr key={`${String(point[xAxisKey])}-${index}`}>
              <th>{String(point[xAxisKey] ?? '')}</th>
              {series.map((item) => (
                <td key={item.dataKey}>{formatValue(Number(point[item.dataKey] ?? 0))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

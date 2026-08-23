import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { color, componentToken, semanticColor } from '@/shared/styles/tokens'

export type LineChartDatum = Record<string, string | number | undefined>

export type LineChartSeries = {
  dataKey: string
  label: string
  tone?: 'primary' | 'neutral'
  dashed?: boolean
}

export type LineChartProps = {
  data: readonly LineChartDatum[]
  xAxisKey: string
  series: readonly LineChartSeries[]
  ariaLabel: string
}

const STROKE_BY_TONE = {
  primary: semanticColor.action.primary,
  neutral: color.neutral[400],
} as const

/** Reusable, token-driven time-series chart for operational dashboards. */
export function LineChart({ data, xAxisKey, series, ariaLabel }: LineChartProps) {
  return (
    <div className="h-chart w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={[...data]} margin={componentToken.chart.margin}>
          <CartesianGrid
            stroke={semanticColor.border.subtle}
            strokeDasharray={componentToken.chart.gridDash}
            vertical={false}
          />
          <XAxis
            dataKey={xAxisKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: semanticColor.text.tertiary }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={componentToken.table.selectionColumnWidth}
            tick={{ fill: semanticColor.text.tertiary }}
          />
          <Tooltip />
          {series.map((item) => (
            <Line
              key={item.dataKey}
              type="monotone"
              dataKey={item.dataKey}
              name={item.label}
              stroke={STROKE_BY_TONE[item.tone ?? 'primary']}
              strokeWidth={componentToken.chart.lineWidth}
              strokeDasharray={item.dashed ? componentToken.chart.gridDash : undefined}
              dot={{ r: componentToken.chart.pointRadius }}
              activeDot={{ r: componentToken.chart.pointRadius + componentToken.chart.lineWidth }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

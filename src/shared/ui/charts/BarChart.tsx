import {
  Bar,
  BarChart as RechartsBarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { color, componentToken, semanticColor } from '@/shared/styles/tokens'

export type BarChartDatum = { label: string; value: number }

export type BarChartProps = {
  data: readonly BarChartDatum[]
  ariaLabel: string
  valueSuffix?: string
}

/** Reusable horizontal comparison chart for small categorical datasets. */
export function BarChart({ data, ariaLabel, valueSuffix = '' }: BarChartProps) {
  return (
    <div className="h-chart w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={[...data]} layout="vertical" margin={componentToken.chart.margin}>
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis
            dataKey="label"
            type="category"
            axisLine={false}
            tickLine={false}
            width={componentToken.table.columnWidth}
            tick={{ fill: semanticColor.text.secondary }}
          />
          <Tooltip
            formatter={(value) => `${value}${valueSuffix}`}
            cursor={{ fill: semanticColor.bg['surface-muted'] }}
          />
          <Bar dataKey="value" radius={componentToken.chart.barRadius}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value) => `${value}${valueSuffix}`}
              fill={semanticColor.text.primary}
            />
            {data.map((item) => (
              <Cell key={item.label} fill={color.neutral[600]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

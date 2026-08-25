import {
  Bar,
  BarChart as RechartsBarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { color, componentToken, radius, semanticColor, shadow, space } from '@/shared/styles/tokens'

export type BarChartDatum = { label: string; value: number }

export type BarChartProps = {
  data: readonly BarChartDatum[]
  ariaLabel: string
  valueSuffix?: string
  valueFormatter?: (value: number) => string
  domain?: readonly [number, number]
}

/** Reusable horizontal comparison chart for small categorical datasets. */
export function BarChart({
  data,
  ariaLabel,
  valueSuffix = '',
  valueFormatter,
  domain = [0, 100],
}: BarChartProps) {
  const formatValue = valueFormatter ?? ((value: number) => `${value}${valueSuffix}`)

  return (
    <figure className="w-full">
      <div className="h-chart w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            accessibilityLayer
            data={[...data]}
            layout="vertical"
            margin={{ top: space[1], right: space[10], bottom: space[1], left: 0 }}
            barCategoryGap={space[3]}
          >
            <XAxis type="number" hide domain={[...domain]} />
            <YAxis
              dataKey="label"
              type="category"
              axisLine={false}
              tickLine={false}
              width={space[20]}
              tick={{ fill: semanticColor.text.secondary }}
            />
            <Tooltip
              formatter={(value) => formatValue(Number(value))}
              cursor={{ fill: semanticColor.bg['surface-subtle'] }}
              contentStyle={{
                background: semanticColor.bg.elevated,
                border: `1px solid ${semanticColor.border.DEFAULT}`,
                borderRadius: radius.lg,
                boxShadow: shadow.md,
              }}
              labelStyle={{ color: semanticColor.text.primary }}
              itemStyle={{ color: semanticColor.text.secondary }}
            />
            <Bar
              dataKey="value"
              fill={color.platform.facebook}
              radius={componentToken.chart.barRadius}
              background={{
                fill: semanticColor.bg['surface-muted'],
                radius: componentToken.chart.barRadius,
              }}
            >
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value) => formatValue(Number(value))}
                fill={semanticColor.text.primary}
              />
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <tbody>
          {data.map((item) => (
            <tr key={item.label}>
              <th>{item.label}</th>
              <td>{formatValue(item.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

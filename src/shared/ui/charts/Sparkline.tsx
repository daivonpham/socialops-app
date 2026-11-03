import { CHART_TONE, type ChartTone } from './palette'

const WIDTH = 120

/**
 * Tiny trend line with a soft fill, for metric cards and table rows. Decorative: the value it
 * illustrates must be shown as text next to it.
 */
export function Sparkline({
  values,
  tone = 'primary',
  className = 'h-8 w-full',
}: {
  values: readonly number[]
  tone?: ChartTone
  className?: string
}) {
  const height = 32
  const max = Math.max(...values, 0)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const step = values.length > 1 ? WIDTH / (values.length - 1) : WIDTH
  const points = values.map(
    (value, index) => [index * step, height - 2 - ((value - min) / span) * (height - 4)] as const,
  )
  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x},${y}`).join(' ')
  const stroke = CHART_TONE[tone]
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      preserveAspectRatio="none"
      className={`block ${className}`}
      aria-hidden="true"
    >
      {points.length > 1 ? (
        <>
          <path d={`${line} L${WIDTH},${height} L0,${height} Z`} fill={stroke} fillOpacity={0.1} />
          <path
            d={line}
            fill="none"
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
    </svg>
  )
}

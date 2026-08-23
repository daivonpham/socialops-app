import { lazy, Suspense } from 'react'
import type { BarChartProps } from './BarChart'
import type { LineChartProps } from './LineChart'

const LazyBarChart = lazy(() =>
  import('./BarChart').then(({ BarChart }) => ({ default: BarChart })),
)
const LazyLineChart = lazy(() =>
  import('./LineChart').then(({ LineChart }) => ({ default: LineChart })),
)

function ChartLoadingState() {
  return <div aria-busy="true" className="h-chart w-full rounded-xl bg-bg-surface-muted" />
}

/** Lazily loads Recharts so non-dashboard routes do not pay for chart code. */
export function BarChart(props: BarChartProps) {
  return (
    <Suspense fallback={<ChartLoadingState />}>
      <LazyBarChart {...props} />
    </Suspense>
  )
}

/** Lazily loads Recharts so non-dashboard routes do not pay for chart code. */
export function LineChart(props: LineChartProps) {
  return (
    <Suspense fallback={<ChartLoadingState />}>
      <LazyLineChart {...props} />
    </Suspense>
  )
}

export type { BarChartDatum, BarChartProps } from './BarChart'
export type { LineChartDatum, LineChartProps, LineChartSeries } from './LineChart'

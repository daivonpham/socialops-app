import { lazy, Suspense, type ComponentProps } from 'react'
import type { BarChartProps } from './BarChart'
import type { LineChartProps } from './LineChart'
import type { AreaTrendChartProps } from './AreaTrendChart'
import type { DivergingBarChartProps } from './DivergingBarChart'

const LazyBarChart = lazy(() =>
  import('./BarChart').then(({ BarChart }) => ({ default: BarChart })),
)
const LazyLineChart = lazy(() =>
  import('./LineChart').then(({ LineChart }) => ({ default: LineChart })),
)

const LazyAreaTrendChart = lazy(() =>
  import('./AreaTrendChart').then(({ AreaTrendChart }) => ({ default: AreaTrendChart })),
)
const LazyDivergingBarChart = lazy(() =>
  import('./DivergingBarChart').then(({ DivergingBarChart }) => ({ default: DivergingBarChart })),
)
const LazyDonutChart = lazy(() =>
  import('./DonutChart').then(({ DonutChart }) => ({ default: DonutChart })),
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

/** Lazily loads Recharts so non-dashboard routes do not pay for chart code. */
export function AreaTrendChart(props: AreaTrendChartProps) {
  return (
    <Suspense fallback={<ChartLoadingState />}>
      <LazyAreaTrendChart {...props} />
    </Suspense>
  )
}

/** Lazily loads Recharts so non-dashboard routes do not pay for chart code. */
export function DivergingBarChart(props: DivergingBarChartProps) {
  return (
    <Suspense fallback={<ChartLoadingState />}>
      <LazyDivergingBarChart {...props} />
    </Suspense>
  )
}

/** Lazily loads Recharts so non-dashboard routes do not pay for chart code. */
export function DonutChart(props: ComponentProps<typeof LazyDonutChart>) {
  return (
    <Suspense
      fallback={
        <div
          aria-busy="true"
          className="mx-auto aspect-square w-full max-w-[200px] rounded-full bg-bg-surface-muted"
        />
      }
    >
      <LazyDonutChart {...props} />
    </Suspense>
  )
}

export { Sparkline } from './Sparkline'
export { CHART_TONE, CHART_TONE_CLASS, type ChartTone } from './palette'
export type { AreaTrendDatum, AreaTrendChartProps } from './AreaTrendChart'
export type { DivergingBarDatum, DivergingBarChartProps } from './DivergingBarChart'
export type { DonutDatum } from './DonutChart'
export type { BarChartDatum, BarChartProps } from './BarChart'
export type { LineChartDatum, LineChartProps, LineChartSeries } from './LineChart'

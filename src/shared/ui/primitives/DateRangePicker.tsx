export type DateRangeValue = [string, string]

export type DateRangePreset = {
  label: string
  value: DateRangeValue
}

export type DateRangePickerProps = {
  value?: DateRangeValue
  presets?: DateRangePreset[]
  onChange?: (value: DateRangeValue | null) => void
  className?: string
  disabled?: boolean
  placeholder?: [string, string]
  'aria-label'?: string
}

const LazyDateRangePicker = lazy(() =>
  import('@/shared/components/ant/DateRangePicker').then(({ DateRangePicker }) => ({
    default: DateRangePicker,
  })),
)

export function DateRangePicker(props: DateRangePickerProps) {
  return (
    <Suspense
      fallback={
        <span className="block h-10 w-full rounded-lg bg-bg-surface-muted" aria-busy="true" />
      }
    >
      <LazyDateRangePicker {...props} />
    </Suspense>
  )
}
import { lazy, Suspense } from 'react'

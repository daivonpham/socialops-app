import { lazy, Suspense, type ReactNode } from 'react'

export type DatePickerProps = {
  value?: string
  displayValue?: string
  showTime?: boolean
  onChange?: (value: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  suffixIcon?: ReactNode
  'aria-label'?: string
}

const LazyDatePicker = lazy(() =>
  import('@/shared/components/ant/DatePicker').then(({ DatePicker }) => ({ default: DatePicker })),
)

export function DatePicker(props: DatePickerProps) {
  return (
    <Suspense
      fallback={
        <span className="block h-10 w-full rounded-lg bg-bg-surface-muted" aria-busy="true" />
      }
    >
      <LazyDatePicker {...props} />
    </Suspense>
  )
}

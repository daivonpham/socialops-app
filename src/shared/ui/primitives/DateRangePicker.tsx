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

export { DateRangePicker } from '@/shared/components/ant/DateRangePicker'

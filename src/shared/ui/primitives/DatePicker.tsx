import type { ReactNode } from 'react'

export type DatePickerProps = {
  value?: string
  displayValue?: string
  onChange?: (value: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  suffixIcon?: ReactNode
  'aria-label'?: string
}

export { DatePicker } from '@/shared/components/ant/DatePicker'

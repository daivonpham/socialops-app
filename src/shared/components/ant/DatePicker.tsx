import { DatePicker as AntDatePicker } from 'antd'
import dayjs from 'dayjs'
import type { DatePickerProps } from '@/shared/ui/primitives/DatePicker'

export function DatePicker({ value, displayValue, onChange, ...props }: DatePickerProps) {
  return (
    <AntDatePicker
      {...props}
      value={value ? dayjs(value) : null}
      format={displayValue ? () => displayValue : undefined}
      allowClear={false}
      inputReadOnly
      onChange={(date) => onChange?.(date.format('YYYY-MM-DD'))}
    />
  )
}

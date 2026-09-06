import { DatePicker as AntDatePicker } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { getDatePickerFormat } from '@/shared/i18n'
import type { DatePickerProps } from '@/shared/ui/primitives/DatePicker'

export function DatePicker({ value, displayValue, onChange, showTime, ...props }: DatePickerProps) {
  const { i18n } = useTranslation()

  return (
    <AntDatePicker
      {...props}
      value={value ? dayjs(value) : null}
      showTime={showTime}
      format={
        displayValue
          ? () => displayValue
          : getDatePickerFormat(i18n.resolvedLanguage, Boolean(showTime))
      }
      allowClear={false}
      inputReadOnly
      onChange={(date) =>
        onChange?.(date ? date.format(showTime ? 'YYYY-MM-DDTHH:mm' : 'YYYY-MM-DD') : '')
      }
    />
  )
}

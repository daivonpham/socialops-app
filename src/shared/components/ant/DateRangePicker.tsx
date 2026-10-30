import { DatePicker as AntDatePicker } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { getDatePickerFormat } from '@/shared/i18n'
import type { DateRangePickerProps } from '@/shared/ui/primitives/DateRangePicker'

const { RangePicker } = AntDatePicker

export function DateRangePicker({ value, presets, onChange, ...props }: DateRangePickerProps) {
  const { i18n } = useTranslation()

  return (
    <RangePicker
      {...props}
      value={value ? [dayjs(value[0]), dayjs(value[1])] : null}
      presets={presets?.map((preset) => ({
        label: preset.label,
        value: [dayjs(preset.value[0]), dayjs(preset.value[1])],
      }))}
      format={getDatePickerFormat(i18n.resolvedLanguage)}
      allowClear={false}
      inputReadOnly
      popupClassName="app-date-range-picker-popup"
      onChange={(dates) =>
        onChange?.(
          dates?.[0] && dates[1]
            ? [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]
            : null,
        )
      }
    />
  )
}

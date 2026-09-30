import { useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { DateRangePicker, FilterDropdown, Select, type DateRangeValue } from '@/shared/ui'
import type { DateRange } from '../api'

export function FacebookFilters({
  range,
  since,
  until,
  compare,
  onChange,
}: {
  range: DateRange
  since?: string
  until?: string
  compare: string
  onChange: (patch: { range?: string; since?: string; until?: string; compare?: string }) => void
}) {
  const { t } = useTranslation('facebook')
  const [draftCompare, setDraftCompare] = useState(compare)
  const today = dayjs().startOf('day')
  const value: DateRangeValue =
    since && until
      ? [since, until]
      : [
          today.subtract(Number(range.slice(0, -1)) - 1, 'day').format('YYYY-MM-DD'),
          today.format('YYYY-MM-DD'),
        ]
  const presetOptions = [
    { days: 7, label: t('common.last7Days') },
    { days: 14, label: t('common.last14Days') },
    { days: 30, label: t('common.last30Days') },
    { days: 90, label: t('common.last90Days') },
  ]
  const presets = presetOptions.map(({ days, label }) => ({
    label,
    value: [
      today.subtract(days - 1, 'day').format('YYYY-MM-DD'),
      today.format('YYYY-MM-DD'),
    ] as DateRangeValue,
  }))

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <DateRangePicker
        aria-label={t('common.dateRange')}
        className="min-w-64"
        value={value}
        presets={presets}
        onChange={(dates) => {
          if (!dates) return
          const days = dayjs(dates[1]).diff(dayjs(dates[0]), 'day') + 1
          const nextRange: DateRange = days === 7 || days === 90 ? `${days}d` : '30d'
          onChange({ range: nextRange, since: dates[0], until: dates[1] })
        }}
      />
      <FilterDropdown
        onOpenChange={(isOpen) => {
          if (isOpen) setDraftCompare(compare)
        }}
        onReset={() => setDraftCompare('previous')}
        onApply={() => onChange({ compare: draftCompare })}
      >
        <Select
          label={t('common.compare')}
          value={draftCompare}
          onChange={(event) => setDraftCompare(event.target.value)}
          options={[
            { value: 'none', label: t('common.noCompare') },
            { value: 'previous', label: t('common.previousPeriod') },
          ]}
        />
      </FilterDropdown>
    </div>
  )
}

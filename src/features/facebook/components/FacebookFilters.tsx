import { useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { DateRangePicker, FilterDropdown, Select, Tabs, type DateRangeValue } from '@/shared/ui'
import { FACEBOOK_POST_CONTENT_TYPES, type DateRange, type FacebookPostContentType } from '../api'

export function FacebookFilters({
  range,
  since,
  until,
  compare,
  contentType,
  onChange,
}: {
  range: DateRange
  since?: string
  until?: string
  compare: string
  /** Lists posts rather than statistics: the filter offers the content type, not a comparison. */
  contentType?: FacebookPostContentType
  onChange: (patch: {
    range?: string
    since?: string
    until?: string
    compare?: string
    contentType?: string
  }) => void
}) {
  const { t } = useTranslation('facebook')
  const [draftCompare, setDraftCompare] = useState(compare)
  const [draftContentType, setDraftContentType] = useState(contentType ?? 'all')
  // "Last N days" are the N whole days before today, as Facebook counts them: today is not over.
  const yesterday = dayjs().startOf('day').subtract(1, 'day')
  const lastDays = (days: number): DateRangeValue => [
    yesterday.subtract(days - 1, 'day').format('YYYY-MM-DD'),
    yesterday.format('YYYY-MM-DD'),
  ]
  const value: DateRangeValue =
    since && until ? [since, until] : lastDays(Number(range.slice(0, -1)))
  const quickRanges = ['7d', '28d', '90d'] as const
  const quickRange = since && until ? undefined : quickRanges.find((item) => item === range)
  const presetOptions = [
    { days: 7, label: t('common.last7Days') },
    { days: 14, label: t('common.last14Days') },
    { days: 28, label: t('common.last28Days') },
    { days: 30, label: t('common.last30Days') },
    { days: 90, label: t('common.last90Days') },
  ]
  const presets = presetOptions.map(({ days, label }) => ({
    label,
    value: lastDays(days),
  }))

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Tabs
        value={quickRange ?? ''}
        ariaLabel={t('common.quickRange')}
        onChange={(next) => onChange({ range: next, since: '', until: '' })}
        options={quickRanges.map((item) => ({
          value: item,
          label: t('common.days', { count: Number(item.slice(0, -1)) }),
        }))}
      />
      <DateRangePicker
        aria-label={t('common.dateRange')}
        className="min-w-64"
        value={value}
        presets={presets}
        // A day that has not begun has no data yet.
        maxDate={dayjs().format('YYYY-MM-DD')}
        onChange={(dates) => {
          if (!dates) return
          const days = dayjs(dates[1]).diff(dayjs(dates[0]), 'day') + 1
          const nextRange: DateRange = days === 7 || days === 28 || days === 90 ? `${days}d` : '30d'
          onChange({ range: nextRange, since: dates[0], until: dates[1] })
        }}
      />
      <FilterDropdown
        onOpenChange={(isOpen) => {
          if (!isOpen) return
          setDraftCompare(compare)
          setDraftContentType(contentType ?? 'all')
        }}
        onReset={() => {
          setDraftCompare('previous')
          setDraftContentType('all')
          // Reset takes effect right away; there is nothing left to choose.
          onChange(contentType ? { contentType: 'all' } : { compare: 'previous' })
        }}
        onApply={() =>
          onChange(contentType ? { contentType: draftContentType } : { compare: draftCompare })
        }
      >
        {contentType ? (
          <Select
            label={t('overview.filterContentType')}
            value={draftContentType}
            showSearch={false}
            onChange={(event) => setDraftContentType(event.target.value as FacebookPostContentType)}
            options={FACEBOOK_POST_CONTENT_TYPES.map((value) => ({
              value,
              label: t(`overview.contentKind.${value}`),
            }))}
          />
        ) : (
          <Select
            label={t('common.compare')}
            value={draftCompare}
            onChange={(event) => setDraftCompare(event.target.value)}
            options={[
              { value: 'none', label: t('common.noCompare') },
              { value: 'previous', label: t('common.previousPeriod') },
            ]}
          />
        )}
      </FilterDropdown>
    </div>
  )
}

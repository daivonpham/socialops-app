import { useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { FilterDropdown } from '../FilterDropdown'
import { DateRangePicker, Select, Tabs, type DateRangeValue } from '../primitives'

export type AnalyticsRange = '7d' | '28d' | '30d' | '90d'

/**
 * Period filter of a statistics screen: quick ranges, a date range and a filter menu holding the
 * comparison (statistics) or a content type (post lists).
 */
export function AnalyticsFilters({
  range,
  since,
  until,
  compare,
  includeToday = false,
  contentType,
  onChange,
}: {
  range: AnalyticsRange
  since?: string
  until?: string
  compare: string
  /**
   * Whether "last N days" end today. Facebook counts whole days, so its ranges end yesterday;
   * TikTok figures come from SocialOps' own snapshots, which include today.
   */
  includeToday?: boolean
  /** Lists content rather than statistics: the menu offers the content type, not a comparison. */
  contentType?: { value: string; label: string; options: Array<{ value: string; label: string }> }
  onChange: (patch: {
    range?: string
    since?: string
    until?: string
    compare?: string
    contentType?: string
  }) => void
}) {
  const { t } = useTranslation('common')
  const [draftCompare, setDraftCompare] = useState(compare)
  const [draftContentType, setDraftContentType] = useState(contentType?.value ?? 'all')
  const lastDay = includeToday ? dayjs().startOf('day') : dayjs().startOf('day').subtract(1, 'day')
  const lastDays = (days: number): DateRangeValue => [
    lastDay.subtract(days - 1, 'day').format('YYYY-MM-DD'),
    lastDay.format('YYYY-MM-DD'),
  ]
  const value: DateRangeValue =
    since && until ? [since, until] : lastDays(Number(range.slice(0, -1)))
  const quickRanges = ['7d', '28d', '90d'] as const
  const quickRange = since && until ? undefined : quickRanges.find((item) => item === range)
  const presets = [7, 14, 28, 30, 90].map((days) => ({
    label: t('analytics.lastDays', { count: days }),
    value: lastDays(days),
  }))

  return (
    // Phone: the quick ranges share a row with Filters and the dates take the next. From 768px
    // everything is one row, the dates taking what is left.
    <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 md:flex md:justify-end md:gap-3 xl:w-auto">
      <Tabs
        // Fills its half of the row on a phone; its own width beside the dates.
        className="min-w-0 max-md:[&_.ant-segmented-item]:min-w-0 max-md:[&_.ant-segmented-item]:flex-1 max-md:[&_.ant-segmented]:flex max-md:[&_.ant-segmented]:w-full md:shrink-0"
        value={quickRange ?? ''}
        ariaLabel={t('analytics.quickRange')}
        onChange={(next) => onChange({ range: next, since: '', until: '' })}
        options={quickRanges.map((item) => ({
          value: item,
          label: t('analytics.days', { count: Number(item.slice(0, -1)) }),
        }))}
      />
      <DateRangePicker
        aria-label={t('analytics.dateRange')}
        className="order-last col-span-2 w-full md:order-none md:w-auto md:min-w-[16rem] md:flex-1 xl:flex-none"
        value={value}
        presets={presets}
        // A day that has not begun has no data yet.
        maxDate={dayjs().format('YYYY-MM-DD')}
        onChange={(dates) => {
          if (!dates) return
          const days = dayjs(dates[1]).diff(dayjs(dates[0]), 'day') + 1
          const nextRange: AnalyticsRange =
            days === 7 || days === 28 || days === 90 ? `${days}d` : '30d'
          onChange({ range: nextRange, since: dates[0], until: dates[1] })
        }}
      />
      <FilterDropdown
        onOpenChange={(isOpen) => {
          if (!isOpen) return
          setDraftCompare(compare)
          setDraftContentType(contentType?.value ?? 'all')
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
            label={contentType.label}
            value={draftContentType}
            showSearch={false}
            onChange={(event) => setDraftContentType(event.target.value)}
            options={contentType.options}
          />
        ) : (
          <Select
            label={t('analytics.compare')}
            value={draftCompare}
            onChange={(event) => setDraftCompare(event.target.value)}
            options={[
              { value: 'none', label: t('analytics.noCompare') },
              { value: 'previous', label: t('analytics.previousPeriod') },
            ]}
          />
        )}
      </FilterDropdown>
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterDropdown, Select } from '@/shared/ui'
import type { DateRange, FacebookPageDto } from '../api'

export function FacebookFilters({
  pages,
  pageId,
  range,
  compare,
  onChange,
}: {
  pages: FacebookPageDto[]
  pageId: string
  range: DateRange
  compare: string
  onChange: (patch: { pageId?: string; range?: string; compare?: string }) => void
}) {
  const { t } = useTranslation('facebook')
  const [draftPageId, setDraftPageId] = useState(pageId)
  const [draftCompare, setDraftCompare] = useState(compare)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Select
        aria-label={t('common.dateRange')}
        value={range}
        onChange={(event) => onChange({ range: event.target.value })}
        options={[
          { value: '7d', label: t('common.last7Days') },
          { value: '30d', label: t('common.last30Days') },
          { value: '90d', label: t('common.last90Days') },
        ]}
      />
      <FilterDropdown
        onOpenChange={(open) => {
          if (!open) return
          setDraftPageId(pageId)
          setDraftCompare(compare)
        }}
        onReset={() => {
          setDraftPageId('all')
          setDraftCompare('previous')
        }}
        onApply={() => onChange({ pageId: draftPageId, compare: draftCompare })}
      >
        <Select
          label={t('common.page')}
          value={draftPageId}
          onChange={(event) => setDraftPageId(event.target.value)}
          options={[
            { value: 'all', label: t('common.allPages') },
            ...pages.map((page) => ({ value: page.id, label: page.name })),
          ]}
        />
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

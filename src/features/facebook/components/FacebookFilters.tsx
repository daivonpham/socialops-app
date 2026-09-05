import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterDropdown, Select } from '@/shared/ui'
import type { DateRange } from '../api'

export function FacebookFilters({
  range,
  compare,
  onChange,
}: {
  range: DateRange
  compare: string
  onChange: (patch: { range?: string; compare?: string }) => void
}) {
  const { t } = useTranslation('facebook')
  const [draftCompare, setDraftCompare] = useState(compare)

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
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

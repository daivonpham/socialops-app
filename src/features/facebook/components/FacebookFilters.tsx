import { useTranslation } from 'react-i18next'
import { Select } from '@/shared/ui'
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
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Select
        aria-label={t('common.page')}
        value={pageId}
        onChange={(event) => onChange({ pageId: event.target.value })}
        options={[
          { value: 'all', label: t('common.allPages') },
          ...pages.map((page) => ({ value: page.id, label: page.name })),
        ]}
      />
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
      <Select
        aria-label={t('common.compare')}
        value={compare}
        onChange={(event) => onChange({ compare: event.target.value })}
        options={[
          { value: 'none', label: t('common.noCompare') },
          { value: 'previous', label: t('common.previousPeriod') },
        ]}
      />
    </div>
  )
}

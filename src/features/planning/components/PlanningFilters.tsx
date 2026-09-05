import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SocialAccountLabel } from '@/features/social-accounts'
import { FilterDropdown, Select } from '@/shared/ui'
import type { PlanningPlatform, PlanningStatus } from '../api'
import type { PlanningAccount } from '../model'

const FILTER_STATUSES: PlanningStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'scheduled',
  'published',
  'failed',
]

export function PlanningFilters({
  accounts,
  platform,
  accountId,
  status,
  onChange,
}: {
  accounts: PlanningAccount[]
  platform: 'all' | PlanningPlatform
  accountId: string
  status: 'all' | PlanningStatus
  onChange: (filters: { accountId: string; status: 'all' | PlanningStatus }) => void
}) {
  const { t } = useTranslation('planning')
  const [draftAccountId, setDraftAccountId] = useState(accountId)
  const [draftStatus, setDraftStatus] = useState<'all' | PlanningStatus>(status)
  const visibleAccounts = accounts.filter(
    (account) => platform === 'all' || account.platform === platform,
  )

  return (
    <FilterDropdown
      onOpenChange={(isOpen) => {
        if (!isOpen) return
        setDraftAccountId(accountId)
        setDraftStatus(status)
      }}
      onReset={() => {
        setDraftAccountId('all')
        setDraftStatus('all')
      }}
      onApply={() => onChange({ accountId: draftAccountId, status: draftStatus })}
    >
      <Select
        label={t('filters.account')}
        value={draftAccountId}
        className="w-full"
        onChange={(event) => setDraftAccountId(event.target.value)}
        options={[
          { value: 'all', label: t('filters.allAccounts') },
          ...visibleAccounts.map((account) => ({
            value: account.id,
            label: <SocialAccountLabel name={account.name} avatarUrl={account.avatarUrl} />,
            searchText: account.name,
          })),
        ]}
      />
      <Select
        label={t('filters.status')}
        value={draftStatus}
        className="w-full"
        onChange={(event) => setDraftStatus(event.target.value as 'all' | PlanningStatus)}
        options={[
          { value: 'all', label: t('filters.allStatuses') },
          ...FILTER_STATUSES.map((item) => ({ value: item, label: t(`status.${item}`) })),
        ]}
      />
    </FilterDropdown>
  )
}

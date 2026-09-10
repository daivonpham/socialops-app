import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SocialAccountLabel } from '@/features/social-accounts'
import { FilterDropdown, Select } from '@/shared/ui'
import type { PlanningApprovalStatus, PlanningPlatform, PlanningStatus } from '../api'
import type { PlanningAccount } from '../model'

const FILTER_STATUSES: PlanningStatus[] = [
  'draft',
  'scheduled',
  'publishing',
  'published',
  'failed',
]

const FILTER_APPROVAL_STATUSES: PlanningApprovalStatus[] = [
  'none',
  'pending',
  'approved',
  'rejected',
]

export function PlanningFilters({
  accounts,
  platform,
  accountId,
  status,
  approvalStatus,
  onChange,
}: {
  accounts: PlanningAccount[]
  platform: 'all' | PlanningPlatform
  accountId: string
  status: 'all' | PlanningStatus
  approvalStatus: 'all' | PlanningApprovalStatus
  onChange: (filters: {
    accountId: string
    status: 'all' | PlanningStatus
    approvalStatus: 'all' | PlanningApprovalStatus
  }) => void
}) {
  const { t } = useTranslation('planning')
  const [draftAccountId, setDraftAccountId] = useState(accountId)
  const [draftStatus, setDraftStatus] = useState<'all' | PlanningStatus>(status)
  const [draftApprovalStatus, setDraftApprovalStatus] = useState<'all' | PlanningApprovalStatus>(
    approvalStatus,
  )
  const visibleAccounts = accounts.filter(
    (account) => platform === 'all' || account.platform === platform,
  )

  return (
    <FilterDropdown
      onOpenChange={(isOpen) => {
        if (!isOpen) return
        setDraftAccountId(accountId)
        setDraftStatus(status)
        setDraftApprovalStatus(approvalStatus)
      }}
      onReset={() => {
        setDraftAccountId('all')
        setDraftStatus('all')
        setDraftApprovalStatus('all')
      }}
      onApply={() =>
        onChange({
          accountId: draftAccountId,
          status: draftStatus,
          approvalStatus: draftApprovalStatus,
        })
      }
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
      <Select
        label={t('filters.approvalStatus')}
        value={draftApprovalStatus}
        className="w-full"
        onChange={(event) =>
          setDraftApprovalStatus(event.target.value as 'all' | PlanningApprovalStatus)
        }
        options={[
          { value: 'all', label: t('filters.allApprovalStatuses') },
          ...FILTER_APPROVAL_STATUSES.map((item) => ({
            value: item,
            label: t(`approvalStatus.${item}`),
          })),
        ]}
      />
    </FilterDropdown>
  )
}

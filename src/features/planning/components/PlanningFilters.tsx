import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SocialAccountLabel } from '@/features/social-accounts'
import { FilterDropdown, Select } from '@/shared/ui'
import type { PlanningApprovalStatus, PlanningPlatform, PlanningPostType } from '../api'
import {
  PLANNING_FILTER_APPROVAL_STATUSES,
  PLANNING_FILTER_POST_TYPES,
  PLANNING_FILTER_STATUS_GROUPS,
  type PlanningStatusGroup,
} from '../config/planning.filters'
import type { PlanningAccount } from '../model'

export function PlanningFilters({
  accounts,
  platform,
  accountId,
  statusGroup,
  type,
  attention,
  approvalStatus,
  onChange,
}: {
  accounts: PlanningAccount[]
  platform: 'all' | PlanningPlatform
  accountId: string
  statusGroup: 'all' | PlanningStatusGroup
  type: 'all' | PlanningPostType
  attention: 'all' | 'needs_action'
  approvalStatus: 'all' | PlanningApprovalStatus
  onChange: (filters: {
    accountId: string
    statusGroup: 'all' | PlanningStatusGroup
    type: 'all' | PlanningPostType
    attention: 'all' | 'needs_action'
    approvalStatus: 'all' | PlanningApprovalStatus
  }) => void
}) {
  const { t } = useTranslation('planning')
  const [draftAccountId, setDraftAccountId] = useState(accountId)
  const [draftStatus, setDraftStatus] = useState<'all' | PlanningStatusGroup>(statusGroup)
  const [draftType, setDraftType] = useState<'all' | PlanningPostType>(type)
  const [draftAttention, setDraftAttention] = useState<'all' | 'needs_action'>(attention)
  const [draftApprovalStatus, setDraftApprovalStatus] = useState<'all' | PlanningApprovalStatus>(
    approvalStatus,
  )
  const visibleAccounts = accounts.filter(
    (account) => platform === 'all' || account.platform === platform,
  )
  const visibleTypes = PLANNING_FILTER_POST_TYPES.filter(
    (item) => platform === 'all' || item.startsWith(`${platform}_`),
  )

  return (
    <FilterDropdown
      onOpenChange={(isOpen) => {
        if (!isOpen) return
        setDraftAccountId(accountId)
        setDraftStatus(statusGroup)
        setDraftType(type)
        setDraftAttention(attention)
        setDraftApprovalStatus(approvalStatus)
      }}
      onReset={() => {
        setDraftAccountId('all')
        setDraftStatus('all')
        setDraftType('all')
        setDraftAttention('all')
        setDraftApprovalStatus('all')
        // Reset takes effect right away; there is nothing left to choose.
        onChange({
          accountId: 'all',
          statusGroup: 'all',
          type: 'all',
          attention: 'all',
          approvalStatus: 'all',
        })
      }}
      onApply={() =>
        onChange({
          accountId: draftAccountId,
          statusGroup: draftStatus,
          type: draftType,
          attention: draftAttention,
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
        label={t('filters.type')}
        value={draftType}
        className="w-full"
        onChange={(event) => setDraftType(event.target.value as 'all' | PlanningPostType)}
        options={[
          { value: 'all', label: t('filters.allTypes') },
          ...visibleTypes.map((item) => ({ value: item, label: t(`postType.${item}`) })),
        ]}
      />
      <Select
        label={t('filters.status')}
        value={draftStatus}
        className="w-full"
        onChange={(event) => setDraftStatus(event.target.value as 'all' | PlanningStatusGroup)}
        options={[
          { value: 'all', label: t('filters.allStatuses') },
          ...PLANNING_FILTER_STATUS_GROUPS.map((item) => ({
            value: item,
            label: t(`statusGroup.${item}`),
          })),
        ]}
      />
      <Select
        label={t('filters.attention')}
        value={draftAttention}
        className="w-full"
        onChange={(event) => setDraftAttention(event.target.value as 'all' | 'needs_action')}
        options={[
          { value: 'all', label: t('filters.allAttention') },
          { value: 'needs_action', label: t('filters.needsAction') },
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
          ...PLANNING_FILTER_APPROVAL_STATUSES.map((item) => ({
            value: item,
            label: t(`approvalStatus.${item}`),
          })),
        ]}
      />
    </FilterDropdown>
  )
}

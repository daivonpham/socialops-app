import { toPlainCaption } from '@/shared/lib/plainCaption'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { hasPermission, usePermissions } from '@/shared/permissions'
import { formatDateTime, formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Avatar,
  Button,
  DataTable,
  EmptyState,
  IconEdit,
  IconView,
  Tooltip,
  type DataTableColumn,
} from '@/shared/ui'
import { SocialAccountLabel } from '@/features/social-accounts'
import { type PlanningApprovalStatus, type PlanningContent, type PlanningPostType } from '../api'
import type { PlanningAccount } from '../model'
import {
  PLANNING_FILTER_APPROVAL_STATUSES,
  PLANNING_FILTER_STATUS_GROUPS,
  type PlanningStatusGroup,
} from '../config/planning.filters'
import { ApprovalStatusSelect } from './ApprovalStatusSelect'
import { PlanningStatusTag } from './PlanningStatusTag'
import { PLANNING_ACCESS } from '../config/planning-access'
import { PlanningMediaThumbnail } from './PlanningMediaThumbnail'

export function PlanningList({
  brandId,
  contents,
  accounts,
  platform,
  accountId,
  statusGroup,
  approvalStatus,
  hasActiveFilters,
  onClearFilters,
  onFiltersChange,
  onSelectContent,
  onEditContent,
}: {
  brandId: string
  contents: PlanningContent[]
  /** Accounts the posts can be filtered by; the column filter shows only with two or more. */
  accounts: PlanningAccount[]
  platform: 'all' | PlanningAccount['platform']
  accountId: string
  statusGroup: 'all' | PlanningStatusGroup
  approvalStatus: 'all' | PlanningApprovalStatus
  hasActiveFilters: boolean
  onClearFilters: () => void
  onFiltersChange: (filters: {
    accountId?: string
    statusGroup?: 'all' | PlanningStatusGroup
    approvalStatus?: 'all' | PlanningApprovalStatus
  }) => void
  onSelectContent: (content: PlanningContent, action?: 'edit' | 'delete') => void
  onEditContent: (content: PlanningContent) => void
}) {
  const { t, i18n } = useTranslation('planning')
  const { granted } = usePermissions()
  const canApprove = hasPermission(granted, PLANNING_ACCESS.approve[0])
  const canSubmit = hasPermission(granted, PLANNING_ACCESS.publish[0])
  const locale = i18n.resolvedLanguage as AppLocale
  const filterAccounts = useMemo(
    () => accounts.filter((account) => platform === 'all' || account.platform === platform),
    [accounts, platform],
  )
  const columns = useMemo<DataTableColumn<PlanningContent>[]>(
    () => [
      {
        key: 'content',
        dataIndex: 'caption',
        title: t('list.content'),
        width: 'content',
        render: (_, row) => {
          const pendingPublication = row.publications?.find((item) => item.pendingCaption)
          return (
            <div className="grid min-w-64 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3">
              <PlanningMediaThumbnail content={row} className="size-12 rounded-lg" />
              <span className="min-w-0">
                <span className="line-clamp-2 text-body-sm leading-relaxed text-text-primary">
                  {toPlainCaption(pendingPublication?.pendingCaption || row.caption) ||
                    t(`postType.${getPostType(row)}`)}
                </span>
                <span className="mt-1 block text-caption text-text-tertiary">
                  {t(`postType.${getPostType(row)}`)}
                  {getPostType(row) === 'facebook_feed'
                    ? ` · ${t(`mediaKind.${row.mediaType}`)}`
                    : ''}
                  {pendingPublication ? ` · ${t(`status.${pendingPublication.status}`)}` : ''}
                </span>
              </span>
            </div>
          )
        },
      },
      {
        key: 'accounts',
        title: t('list.accounts'),
        width: 'wide',
        ...(filterAccounts.length > 1
          ? {
              filterValue: accountId,
              filterDefaultValue: 'all',
              filterOptions: [
                { value: 'all', label: t('filters.allAccounts') },
                ...filterAccounts.map((account) => ({
                  value: account.id,
                  label: <SocialAccountLabel name={account.name} avatarUrl={account.avatarUrl} />,
                })),
              ],
              onFilterChange: (value: string) => onFiltersChange({ accountId: value }),
            }
          : {}),
        render: (_, row) => {
          const visibleTargets = row.targets.slice(0, 3)
          const remainingCount = Math.max(0, row.targets.length - visibleTargets.length)
          return (
            <Tooltip title={row.targets.map((target) => target.name).join(', ')} placement="top">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex shrink-0 -space-x-2">
                  {row.targets.slice(0, 3).map((target) => (
                    <Avatar
                      key={target.id}
                      name={target.name}
                      src={target.avatarUrl}
                      size="sm"
                      className="ring-2 ring-bg-surface"
                    />
                  ))}
                </div>
                <span className="min-w-0">
                  <strong className="line-clamp-2 text-label-md text-text-secondary">
                    {visibleTargets.map((target) => target.name).join(', ') || '—'}
                  </strong>
                  <span className="block text-caption text-text-tertiary">
                    {remainingCount > 0
                      ? t('list.morePages', {
                          count: remainingCount,
                          formattedCount: formatNumber(remainingCount, locale),
                        })
                      : t('list.pageCount', {
                          count: row.targets.length,
                          formattedCount: formatNumber(row.targets.length, locale),
                        })}
                  </span>
                </span>
              </div>
            </Tooltip>
          )
        },
      },
      {
        key: 'status',
        dataIndex: 'status',
        title: t('list.status'),
        width: 'default',
        filterValue: statusGroup,
        filterDefaultValue: 'all',
        filterOptions: [
          { value: 'all', label: t('filters.allStatuses') },
          ...PLANNING_FILTER_STATUS_GROUPS.map((item) => ({
            value: item,
            label: t(`statusGroup.${item}`),
          })),
        ],
        onFilterChange: (value) =>
          onFiltersChange({ statusGroup: value as 'all' | PlanningStatusGroup }),
        render: (_, row) => {
          const publications = (row.publications ?? []).filter(
            (item) => !['cancelled', 'deleted'].includes(item.status),
          )
          const published = publications.filter((item) => item.status === 'published').length
          const needsAction =
            publications.some((item) =>
              ['failed', 'unknown', 'edit_unknown', 'delete_unknown'].includes(item.status),
            ) || ['failed', 'unknown', 'edit_unknown', 'delete_unknown'].includes(row.status)
          return (
            <div className="grid gap-1">
              <PlanningStatusTag content={row} showTime />
              {publications.length > 1 &&
                !['draft', 'scheduled', 'cancelled'].includes(row.status) && (
                  <span className="text-caption text-text-secondary">
                    {t('list.pagesPublished', { published, total: publications.length })}
                  </span>
                )}
              {needsAction && (
                <span className="text-caption text-error-700">{t('list.needsAction')}</span>
              )}
            </div>
          )
        },
      },
      {
        key: 'approvalStatus',
        dataIndex: 'approvalStatus',
        title: t('list.approvalStatus'),
        width: 'wide',
        filterValue: approvalStatus,
        filterDefaultValue: 'all',
        filterOptions: [
          { value: 'all', label: t('filters.allApprovalStatuses') },
          ...PLANNING_FILTER_APPROVAL_STATUSES.map((item) => ({
            value: item,
            label: t(`approvalStatus.${item}`),
          })),
        ],
        onFilterChange: (value) =>
          onFiltersChange({
            approvalStatus: value as 'all' | PlanningApprovalStatus,
          }),
        render: (_, row) => (
          <ApprovalStatusSelect
            brandId={brandId}
            content={row}
            canApprove={canApprove}
            canSubmit={canSubmit}
          />
        ),
      },
      {
        key: 'scheduledAt',
        dataIndex: 'scheduledAt',
        title: t('list.scheduledAt'),
        width: 'wide',
        render: (_, row) => {
          const latestPublishedAt = row.publications
            ?.map((item) => item.publishedAt)
            .filter((value): value is string => Boolean(value))
            .sort()
            .at(-1)
          const isScheduled =
            Boolean(row.scheduledAt) && !['draft', 'cancelled'].includes(row.status)
          const label = latestPublishedAt
            ? 'timePublished'
            : isScheduled
              ? 'timeScheduled'
              : 'timeCreated'
          const value = latestPublishedAt ?? (isScheduled ? row.scheduledAt : row.createdAt)
          return (
            <span className="grid whitespace-nowrap tabular-nums">
              <span className="text-caption text-text-tertiary">{t(`list.${label}`)}</span>
              <span className="text-body-sm text-text-secondary">
                {formatDateTime(value!, locale)}
              </span>
            </span>
          )
        },
      },
      {
        key: 'createdBy',
        dataIndex: 'createdBy',
        title: t('list.createdBy'),
        width: 'default',
      },
      {
        key: 'actions',
        title: t('list.actions'),
        width: 'actions',
        align: 'center',
        fixed: 'right',
        hideable: false,
        reorderable: false,
        resizable: false,
        render: (_, row) => (
          <div className="flex items-center justify-center gap-1">
            {['draft', 'scheduled', 'failed'].includes(row.status) ||
            (row.publications?.some((item) => item.status === 'published') &&
              ['facebook_feed', 'facebook_reel'].includes(row.type ?? '')) ? (
              <Button
                size="sm"
                variant="ghost"
                icon={<IconEdit />}
                aria-label={t('list.editContent', { title: row.title ?? row.caption })}
                onClick={(event) => {
                  event.stopPropagation()
                  onEditContent(row)
                }}
              />
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              icon={<IconView />}
              aria-label={t('list.openDetails', { title: row.title ?? row.caption })}
              onClick={(event) => {
                event.stopPropagation()
                onSelectContent(row)
              }}
            />
          </div>
        ),
      },
    ],
    [
      accountId,
      approvalStatus,
      brandId,
      locale,
      onEditContent,
      onFiltersChange,
      onSelectContent,
      statusGroup,
      t,
      canApprove,
      canSubmit,
      filterAccounts,
    ],
  )

  return (
    <DataTable
      data={contents}
      columns={columns}
      getRowId={(row) => row.id}
      title={t('list.title')}
      onRowClick={onSelectContent}
      emptyState={
        <EmptyState
          title={t('states.emptyTitle')}
          description={t('states.emptyDescription')}
          action={
            hasActiveFilters ? (
              <Button onClick={onClearFilters}>{t('filters.clear')}</Button>
            ) : undefined
          }
        />
      }
      ariaLabel={t('list.ariaLabel')}
      showColumnSettings
      columnPersistenceKey={`planning-list:${brandId}`}
      stickyHeader
    />
  )
}

function getPostType(row: PlanningContent): PlanningPostType {
  if (row.type) return row.type
  if (row.platform === 'facebook') return 'facebook_feed'
  return row.mediaType === 'image' ? 'tiktok_photo' : 'tiktok_video'
}

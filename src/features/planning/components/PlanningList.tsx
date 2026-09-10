import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDateTime, formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Avatar,
  Button,
  DataTable,
  EmptyState,
  IconEdit,
  IconImage,
  IconView,
  StatusTag,
  Tooltip,
  type DataTableColumn,
} from '@/shared/ui'
import { useUpdatePlanningApproval, type PlanningContent } from '../api'
import { PLANNING_STATUS_TONE } from '../model'
import { ApprovalStatusSelect } from './ApprovalStatusSelect'

export function PlanningList({
  brandId,
  contents,
  onSelectContent,
  onEditContent,
}: {
  brandId: string
  contents: PlanningContent[]
  onSelectContent: (content: PlanningContent) => void
  onEditContent: (content: PlanningContent) => void
}) {
  const { t, i18n } = useTranslation('planning')
  const locale = i18n.resolvedLanguage as AppLocale
  const updateApproval = useUpdatePlanningApproval(brandId)
  const columns = useMemo<DataTableColumn<PlanningContent>[]>(
    () => [
      {
        key: 'content',
        dataIndex: 'caption',
        title: t('list.content'),
        width: 'content',
        render: (_, row) => (
          <div className="grid min-w-64 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3">
            {row.thumbnailUrl ? (
              <img
                src={row.thumbnailUrl}
                alt=""
                loading="lazy"
                className="size-12 rounded-lg object-cover"
              />
            ) : (
              <span className="flex size-12 items-center justify-center rounded-lg bg-bg-surface-muted text-text-tertiary">
                <IconImage />
              </span>
            )}
            <span className="line-clamp-2 min-w-0 text-body-sm leading-relaxed text-text-primary">
              {row.caption}
            </span>
          </div>
        ),
      },
      {
        key: 'accounts',
        title: t('list.accounts'),
        width: 'wide',
        render: (_, row) => {
          const [firstTarget] = row.targets
          const remainingCount = Math.max(0, row.targets.length - 1)
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
                  <strong className="block truncate text-label-md text-text-secondary">
                    {firstTarget?.name ?? '—'}
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
        render: (_, row) => (
          <StatusTag tone={PLANNING_STATUS_TONE[row.status]}>{t(`status.${row.status}`)}</StatusTag>
        ),
      },
      {
        key: 'approvalStatus',
        dataIndex: 'approvalStatus',
        title: t('list.approvalStatus'),
        width: 'wide',
        render: (_, row) => (
          <ApprovalStatusSelect
            value={row.approvalStatus}
            disabled={updateApproval.isPending && updateApproval.variables?.contentId === row.id}
            onChange={(approvalStatus) => {
              updateApproval.mutate({ brandId, contentId: row.id, approvalStatus })
            }}
          />
        ),
      },
      {
        key: 'scheduledAt',
        dataIndex: 'scheduledAt',
        title: t('list.scheduledAt'),
        width: 'wide',
        render: (_, row) => (
          <span className="whitespace-nowrap text-body-sm tabular-nums text-text-secondary">
            {row.scheduledAt ? formatDateTime(row.scheduledAt, locale) : '—'}
          </span>
        ),
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
    [brandId, locale, onEditContent, onSelectContent, t, updateApproval],
  )

  return (
    <DataTable
      data={contents}
      columns={columns}
      getRowId={(row) => row.id}
      title={t('list.title')}
      onRowClick={onSelectContent}
      emptyState={
        <EmptyState title={t('states.emptyTitle')} description={t('states.emptyDescription')} />
      }
      ariaLabel={t('list.ariaLabel')}
      showColumnSettings
      columnPersistenceKey={`planning-list:${brandId}`}
      stickyHeader
    />
  )
}

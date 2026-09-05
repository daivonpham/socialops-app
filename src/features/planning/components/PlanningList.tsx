import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import {
  Button,
  DataTable,
  EmptyState,
  IconFacebook,
  IconImage,
  IconTikTok,
  IconView,
  StatusTag,
  type DataTableColumn,
} from '@/shared/ui'
import type { PlanningContent } from '../api'
import { PLANNING_STATUS_TONE } from '../model'

export function PlanningList({
  contents,
  onSelectContent,
}: {
  contents: PlanningContent[]
  onSelectContent: (content: PlanningContent) => void
}) {
  const { t, i18n } = useTranslation('planning')
  const locale = i18n.resolvedLanguage as AppLocale
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }),
    [locale],
  )
  const columns = useMemo<DataTableColumn<PlanningContent>[]>(
    () => [
      {
        key: 'content',
        dataIndex: 'caption',
        title: t('list.content'),
        width: 'content',
        sortable: true,
        render: (_, row) => (
          <div className="flex min-w-64 items-center gap-3">
            {row.thumbnailUrl ? (
              <img
                src={row.thumbnailUrl}
                alt=""
                loading="lazy"
                className="h-11 w-11 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-bg-surface-muted text-text-tertiary">
                <IconImage />
              </span>
            )}
            <span className="min-w-0">
              <strong className="line-clamp-1 block text-label-md text-text-primary">
                {row.title ?? row.caption}
              </strong>
              <span className="line-clamp-1 text-caption text-text-tertiary">{row.caption}</span>
            </span>
          </div>
        ),
      },
      {
        key: 'platform',
        dataIndex: 'platform',
        title: t('list.platform'),
        width: 'default',
        sortable: true,
        render: (_, row) => (
          <span className="flex items-center gap-2 text-body-sm text-text-secondary">
            {row.platform === 'facebook' ? (
              <IconFacebook className="text-platform-facebook" />
            ) : (
              <IconTikTok className="text-text-primary" />
            )}
            {t(`platform.${row.platform}`)}
          </span>
        ),
      },
      {
        key: 'accounts',
        title: t('list.accounts'),
        width: 'wide',
        render: (_, row) => (
          <div className="max-w-56">
            <span className="line-clamp-1 text-body-sm text-text-secondary">
              {row.targets.map((target) => target.name).join(', ')}
            </span>
            <span className="text-caption text-text-tertiary">
              {t('calendar.targetCount', {
                count: row.targets.length,
                formattedCount: formatNumber(row.targets.length, locale),
              })}
            </span>
          </div>
        ),
      },
      {
        key: 'status',
        dataIndex: 'status',
        title: t('list.status'),
        width: 'default',
        sortable: true,
        render: (_, row) => (
          <StatusTag tone={PLANNING_STATUS_TONE[row.status]}>{t(`status.${row.status}`)}</StatusTag>
        ),
      },
      {
        key: 'scheduledAt',
        dataIndex: 'scheduledAt',
        title: t('list.scheduledAt'),
        width: 'wide',
        sortable: true,
        render: (_, row) => (
          <span className="whitespace-nowrap text-body-sm tabular-nums text-text-secondary">
            {row.scheduledAt ? dateFormatter.format(new Date(row.scheduledAt)) : '—'}
          </span>
        ),
      },
      {
        key: 'createdBy',
        dataIndex: 'createdBy',
        title: t('list.createdBy'),
        width: 'default',
        sortable: true,
      },
      {
        key: 'actions',
        title: t('list.actions'),
        width: 'actions',
        align: 'center',
        hideable: false,
        reorderable: false,
        resizable: false,
        render: (_, row) => (
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
        ),
      },
    ],
    [dateFormatter, locale, onSelectContent, t],
  )

  return (
    <DataTable
      data={contents}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={onSelectContent}
      emptyState={
        <EmptyState title={t('states.emptyTitle')} description={t('states.emptyDescription')} />
      }
      ariaLabel={t('list.ariaLabel')}
      stickyHeader
    />
  )
}

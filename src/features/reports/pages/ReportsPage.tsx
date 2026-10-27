import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFacebookIntegration } from '@/features/facebook'
import { formatDate } from '@/shared/i18n'
import { hasPermission, PERMISSIONS, usePermissions } from '@/shared/permissions'
import { useActiveBrand } from '@/shared/scope'
import {
  Button,
  ConfirmDialog,
  DataTable,
  Dropdown,
  EmptyState,
  IconCopy,
  IconFileText,
  IconMore,
  IconOpen,
  IconPlus,
  IconSearch,
  IconTrash,
  Input,
  Pagination,
  SectionError,
  SectionSkeleton,
  useToast,
  type DataTableColumn,
} from '@/shared/ui'
import { useReports } from '../api/hooks'
import { deleteReport, duplicateReport } from '../api/service'
import type { SavedReport } from '../api/types'
import { ReportsShowcase } from '../components/ReportsShowcase'

export default function ReportsPage() {
  const { t, i18n } = useTranslation('reports')
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { brandId } = useActiveBrand()
  const { granted } = usePermissions()
  const canManage = hasPermission(granted, PERMISSIONS.REPORTS_MANAGE.key)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState<SavedReport | null>(null)
  const [deleting, setDeleting] = useState(false)
  const reports = useReports(brandId, page, search.trim())
  const facebook = useFacebookIntegration(brandId)

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['reports', brandId] })

  const duplicate = async (report: SavedReport) => {
    if (!brandId) return
    try {
      const copy = await duplicateReport(brandId, report.id)
      refresh()
      navigate(`/reports/${copy.id}`)
    } catch {
      toast.error({ title: t('list.actionError') })
    }
  }

  const remove = async () => {
    if (!brandId || !toDelete) return
    setDeleting(true)
    try {
      await deleteReport(brandId, toDelete.id)
      toast.success({ title: t('list.deleted') })
      setToDelete(null)
      refresh()
    } catch {
      toast.error({ title: t('list.actionError') })
    } finally {
      setDeleting(false)
    }
  }

  const columns: DataTableColumn<SavedReport>[] = [
    {
      key: 'name',
      title: t('list.name'),
      width: 'wide',
      size: 280,
      hideable: false,
      render: (_, report) => (
        <Link
          to={`/reports/${report.id}`}
          className="flex min-w-0 items-center gap-3 rounded-sm outline-none focus-visible:focus-ring"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-surface-subtle text-icon-md text-brand-600">
            <IconFileText aria-hidden />
          </span>
          <span className="truncate text-label-md text-text-primary hover:text-link">
            {report.name}
          </span>
        </Link>
      ),
    },
    {
      key: 'template',
      title: t('list.template'),
      size: 200,
      render: (_, report) => (
        <span className="text-body-sm text-text-secondary">
          {t(`templates.${report.config.template}`)}
        </span>
      ),
    },
    {
      key: 'pages',
      title: t('list.pages'),
      size: 130,
      render: (_, report) => (
        <span className="text-body-sm text-text-secondary">
          {report.config.pageIds === 'all'
            ? t('list.allPages')
            : t('list.pageCount', { count: report.config.pageIds.length })}
        </span>
      ),
    },
    {
      key: 'period',
      title: t('list.period'),
      size: 200,
      render: (_, report) => (
        <span className="text-body-sm text-text-secondary">
          {report.config.period.preset === 'custom'
            ? `${formatDate(report.config.period.since, i18n.language)} – ${formatDate(report.config.period.until, i18n.language)}`
            : t(`presets.${report.config.period.preset}`)}
        </span>
      ),
    },
    {
      key: 'updated',
      title: t('list.updated'),
      size: 130,
      render: (_, report) => (
        <span className="text-body-sm text-text-tertiary">
          {formatDate(report.updatedAt, i18n.language)}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '',
      width: 'compact',
      size: 64,
      align: 'end',
      hideable: false,
      reorderable: false,
      resizable: false,
      render: (_, report) => (
        <Dropdown
          placement="bottomRight"
          onSelect={(key) => {
            if (key === 'open') navigate(`/reports/${report.id}`)
            if (key === 'duplicate') void duplicate(report)
            if (key === 'delete') setToDelete(report)
          }}
          items={[
            { key: 'open', label: t('list.open'), icon: <IconOpen aria-hidden /> },
            ...(canManage
              ? [
                  { key: 'duplicate', label: t('list.duplicate'), icon: <IconCopy aria-hidden /> },
                  { type: 'divider' as const },
                  {
                    key: 'delete',
                    label: t('list.delete'),
                    icon: <IconTrash aria-hidden />,
                    danger: true,
                  },
                ]
              : []),
          ]}
        >
          <Button
            variant="ghost"
            size="sm"
            icon={<IconMore aria-hidden />}
            aria-label={t('list.actions', { name: report.name })}
          />
        </Dropdown>
      ),
    },
  ]

  if (!brandId)
    return (
      <div className="py-16">
        <EmptyState title={t('noBrandTitle')} description={t('noBrandDescription')} />
      </div>
    )

  const items = reports.data?.items ?? []
  const searching = search.trim().length > 0

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading-2 font-semibold text-text-primary">{t('title')}</h1>
          <p className="mt-1 text-body-sm text-text-secondary">{t('subtitle')}</p>
        </div>
        {canManage ? (
          <Button
            variant="primary"
            icon={<IconPlus aria-hidden />}
            onClick={() => navigate('/reports/new')}
          >
            {t('create')}
          </Button>
        ) : null}
      </header>

      {facebook.data?.state === 'disconnected' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-surface-subtle px-4 py-3">
          <p className="text-body-sm text-text-secondary">{t('noPages')}</p>
          <Link
            to="/platforms/facebook/overview"
            className="rounded-sm text-label-md text-link outline-none hover:text-link-hover focus-visible:focus-ring"
          >
            {t('connectFacebook')}
          </Link>
        </div>
      ) : null}

      <ReportsShowcase />

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-heading-3 text-text-primary">{t('list.title')}</h2>
            <p className="mt-1 text-body-sm text-text-tertiary">{t('list.description')}</p>
          </div>
          <div className="w-full sm:w-[288px]">
            <Input
              type="search"
              value={search}
              prefix={<IconSearch aria-hidden className="text-text-tertiary" />}
              placeholder={t('list.search')}
              aria-label={t('list.search')}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>

        {reports.isPending ? (
          <SectionSkeleton rows={5} />
        ) : reports.isError ? (
          <SectionError
            title={t('loadError')}
            retryLabel={t('retry')}
            onRetry={() => void reports.refetch()}
          />
        ) : items.length ? (
          <>
            <DataTable
              data={items}
              columns={columns}
              getRowId={(report) => report.id}
              ariaLabel={t('list.title')}
            />
            {reports.data && reports.data.total > reports.data.limit ? (
              <div className="flex justify-end">
                <Pagination
                  current={page}
                  pageSize={reports.data.limit}
                  total={reports.data.total}
                  onChange={setPage}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-border-subtle bg-bg-surface px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl border border-border-subtle bg-bg-surface text-icon-md text-brand-600 shadow-xs">
              <IconFileText aria-hidden />
            </span>
            <div>
              <h3 className="text-heading-4 text-text-primary">
                {searching ? t('list.searchEmptyTitle') : t('list.emptyTitle')}
              </h3>
              <p className="mt-1 max-w-md text-body-sm text-text-tertiary">
                {searching ? t('list.searchEmptyDescription') : t('list.emptyDescription')}
              </p>
            </div>
            {canManage && !searching ? (
              <Button
                variant="primary"
                icon={<IconPlus aria-hidden />}
                onClick={() => navigate('/reports/new')}
              >
                {t('create')}
              </Button>
            ) : null}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        title={t('list.deleteTitle')}
        description={t('list.deleteDescription', { name: toDelete?.name ?? '' })}
        confirmLabel={t('list.delete')}
        loading={deleting}
        onConfirm={() => void remove()}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

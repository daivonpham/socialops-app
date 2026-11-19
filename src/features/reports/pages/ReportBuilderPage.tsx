import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFacebookIntegration } from '@/features/facebook'
import {
  connectGoogleInPopup,
  GOOGLE_QUERY_KEYS,
  isGoogleConsentCancelled,
  needsGoogleConsent,
  useGoogleConnection,
} from '@/features/google'
import { hasPermission, PERMISSIONS, usePermissions } from '@/shared/permissions'
import { useActiveBrand } from '@/shared/scope'
import {
  Button,
  Checkbox,
  ConfirmDialog,
  DateRangePicker,
  EmptyState,
  IconArrowLeft,
  IconPanelLeftOpen,
  IconPanelRightOpen,
  useTopLoading,
  IconBarChart,
  IconFileText,
  IconLayers,
  Input,
  SectionError,
  SectionSkeleton,
  Select,
  useToast,
} from '@/shared/ui'
import { useReport, useReportPreview } from '../api/hooks'
import {
  createReport,
  exportReport,
  exportReportPdf,
  exportReportSheets,
  getReportRefresh,
  requestReportRefresh,
  updateReport,
} from '../api/service'
import type { ReportConfig, ReportMetricId, ReportRefresh } from '../api/types'
import { ReportExportMenu, type ExportFormat } from '../components/ReportExportMenu'
import { ReportFreshnessBar } from '../components/ReportFreshnessBar'
import { ReportPagesPicker } from '../components/ReportPagesPicker'
import { ReportDataPreview } from '../components/ReportDataPreview'
import { ReportSectionsEditor } from '../components/ReportSectionsEditor'
import { ReportStepDots, ReportStepHeader, ReportStepper } from '../components/ReportStepper'
import { ReportTemplatePicker } from '../components/ReportTemplatePicker'
import {
  DAILY_METRICS,
  defaultReportConfig,
  hydrateReportConfig,
  REPORT_METRIC_IDS,
  reportConfigFromSearch,
} from '../model/report-config'
import { periodDates, reportDatePresets } from '../model/report-period'
import { CodedError } from '@/shared/api/errors'
import { useApiErrorMessage, useLeaveGuard } from '@/shared/hooks'

type Step = 1 | 2 | 3
const TOTAL_STEPS = 3
const CONTENT_TYPES = ['post', 'reel', 'story'] as const

/**
 * Report wizard laid out as a left step rail and a centered step panel: details (name,
 * template, Pages, dates) → content (sections) → preview with save and export.
 */
export default function ReportBuilderPage() {
  const { t } = useTranslation('reports')
  const errorMessage = useApiErrorMessage('reports')
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { brandId } = useActiveBrand()
  const { granted } = usePermissions()
  const canManage = hasPermission(granted, PERMISSIONS.REPORTS_MANAGE.key)
  const { reportId } = useParams<{ reportId: string }>()
  const [searchParams] = useSearchParams()
  const initialConfig = useMemo(() => reportConfigFromSearch(searchParams), [searchParams])

  const [config, setConfig] = useState<ReportConfig>(initialConfig)
  const [previewConfig, setPreviewConfig] = useState<ReportConfig>(initialConfig)
  const [name, setName] = useState('')
  const [step, setStep] = useState<Step>(reportId ? 3 : 1)
  const [reached, setReached] = useState<Step>(reportId ? 3 : 1)
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  useTopLoading(exporting)
  const [refresh, setRefresh] = useState<ReportRefresh | null>(null)
  const [postsPage, setPostsPage] = useState(1)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  const saved = useReport(brandId, reportId ?? null)
  const facebook = useFacebookIntegration(brandId)
  const google = useGoogleConnection()
  const preview = useReportPreview(brandId, previewConfig, postsPage, name, step === 3)
  const pages = (facebook.data?.pages ?? []).filter((page) => page.health !== 'disconnected')
  const selectedPages = config.pageIds === 'all' ? pages.length : config.pageIds.length
  // CSV choices are exactly the tables the export contains.

  // Open a saved report on its preview.
  useEffect(() => {
    if (!saved.data || saved.data.id === loadedId) return
    const normalized = hydrateReportConfig(saved.data.config)
    setConfig(normalized)
    setPreviewConfig(normalized)
    setName(saved.data.name)
    setLoadedId(saved.data.id)
  }, [loadedId, saved.data])

  // Debounce preview requests while the configuration changes.
  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewConfig(config), 400)
    return () => window.clearTimeout(timer)
  }, [config])

  // Pick up a refresh another member started for this brand.
  const activeRefreshId = preview.data?.freshness.activeRefresh?.id
  useEffect(() => {
    if (!brandId || !activeRefreshId || refresh?.id === activeRefreshId) return
    void getReportRefresh(brandId, activeRefreshId)
      .then(setRefresh)
      .catch(() => undefined)
  }, [activeRefreshId, brandId, refresh?.id])

  // Poll a running refresh and reload the preview when it finishes.
  useEffect(() => {
    if (!brandId || !refresh || !['queued', 'running'].includes(refresh.status)) return
    const timer = window.setInterval(() => {
      void getReportRefresh(brandId, refresh.id)
        .then((next) => {
          setRefresh(next)
          if (next.status === 'completed') toast.success({ title: t('freshness.done') })
          if (next.status === 'partial') toast.warning({ title: t('freshness.partial') })
          if (next.status === 'failed')
            toast.error({
              title: errorMessage(
                new CodedError(next.errorCode ?? 'REPORT_REFRESH_FAILED'),
                t('freshness.failed'),
              ),
            })
          if (next.status === 'completed' || next.status === 'partial') void preview.refetch()
        })
        .catch(() => undefined)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [brandId, preview, refresh, t, toast])

  const dirty = saved.data
    ? name !== saved.data.name ||
      JSON.stringify(config) !== JSON.stringify(hydrateReportConfig(saved.data.config))
    : !reportId && (name.trim() !== '' || JSON.stringify(config) !== JSON.stringify(initialConfig))
  const leaveGuard = useLeaveGuard(dirty)

  const patch = (value: Partial<ReportConfig>) => {
    setConfig((current) => ({ ...current, ...value }))
    setPostsPage(1)
    setError('')
  }

  const validate = (target: Step): string => {
    if (target >= 2 && !name.trim()) return t('details.nameRequired')
    if (target >= 2 && selectedPages === 0) return t('details.pagesRequired')
    if (target >= 3 && !config.sections.some((section) => section.enabled))
      return t('content.required')
    if (
      target >= 3 &&
      config.sections.some((section) => section.id === 'kpis' && section.enabled) &&
      config.kpiMetrics.length === 0
    )
      return t('content.metricsRequired')
    if (
      target >= 3 &&
      config.sections.some((section) => section.id === 'trends' && section.enabled) &&
      config.trendMetrics.length === 0
    )
      return t('content.metricsRequired')
    if (
      target >= 3 &&
      config.sections.some(
        (section) =>
          section.enabled &&
          ['content_mix', 'top_posts', 'bottom_posts', 'posts_table', 'best_times'].includes(
            section.id,
          ),
      ) &&
      config.contentFilter?.types.length === 0
    )
      return t('content.typesRequired')
    return ''
  }

  const goTo = (target: Step) => {
    if (target > step) {
      const problem = validate(target)
      if (problem) {
        setError(problem)
        return
      }
    }
    setError('')
    setStep(target)
    setReached((current) => (target > current ? target : current))
  }

  const save = async () => {
    if (!brandId) return
    setSaving(true)
    try {
      if (reportId && saved.data) {
        const updated = await updateReport(brandId, reportId, {
          name: name.trim(),
          config,
          version: saved.data.version,
        })
        queryClient.setQueryData(['reports', brandId, reportId], updated)
      } else {
        const created = await createReport(brandId, { name: name.trim(), config })
        leaveGuard.allowLeave()
        navigate(`/reports/${created.id}`, { replace: true })
      }
      void queryClient.invalidateQueries({ queryKey: ['reports', brandId] })
      toast.success({ title: t('preview.saved') })
    } catch (cause) {
      toast.error({ title: errorMessage(cause, t('preview.saveError')) })
    } finally {
      setSaving(false)
    }
  }

  /**
   * Google Sheets needs the user's Google grant. Without one, consent opens in a popup straight
   * from this click (before any await, so it is not blocked) and the export continues after it.
   * The new spreadsheet opens in a new tab once it exists; if the browser blocks that tab (it no
   * longer counts as part of the click), a toast offers the link instead.
   */
  const exportSheets = () => {
    if (!brandId) return
    const needsConsent = !google.data?.connected || !google.data.usable
    const idempotencyKey = crypto.randomUUID()
    setExporting(true)
    const consent = needsConsent ? connectGoogleInPopup() : Promise.resolve(null)
    void consent
      .then(() => exportReportSheets(brandId, { config, title: name.trim() }, idempotencyKey))
      .then(({ url }) => {
        // With `noopener` window.open always returns null, so detach the opener by hand to
        // still learn whether the browser blocked the tab.
        const tab = window.open(url, '_blank')
        if (tab) {
          tab.opener = null
          return
        }
        toast.success({
          title: t('preview.sheetsCreated'),
          duration: 15,
          description: (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-link underline hover:text-link-hover"
            >
              {t('preview.openSheet')}
            </a>
          ),
        })
      })
      .catch((cause: unknown) => {
        if (isGoogleConsentCancelled(cause)) return
        if (needsGoogleConsent(cause)) {
          // The grant was revoked since we last checked; the next click asks for consent.
          void queryClient.invalidateQueries({ queryKey: GOOGLE_QUERY_KEYS.connection })
          toast.warning({ title: t('preview.sheetsReconnect') })
          return
        }
        toast.error({ title: errorMessage(cause, t('preview.sheetsError')) })
      })
      .finally(() => {
        setExporting(false)
        if (needsConsent)
          void queryClient.invalidateQueries({ queryKey: GOOGLE_QUERY_KEYS.connection })
      })
  }

  const exportFile = async (format: ExportFormat) => {
    if (!brandId) return
    if (format === 'sheets') return exportSheets()
    setExporting(true)
    try {
      if (format === 'pdf') {
        await exportReportPdf(brandId, { config, title: name.trim() })
      } else await exportReport(brandId, { config, format, title: name.trim() })
    } catch (error) {
      toast.error({
        title: errorMessage(
          error,
          t(format === 'pdf' ? 'preview.pdfError' : 'preview.exportError'),
        ),
      })
    } finally {
      setExporting(false)
    }
  }

  const startRefresh = async () => {
    if (!brandId || !preview.data) return
    const { period } = preview.data.meta
    try {
      setRefresh(
        await requestReportRefresh(brandId, {
          kind: preview.data.freshness.missingRanges.length ? 'backfill' : 'refresh_posts',
          since: period.since,
          until: period.until,
          ...(config.pageIds === 'all' ? {} : { pageIds: config.pageIds }),
        }),
      )
    } catch (error) {
      toast.error({ title: errorMessage(error, t('freshness.failed')) })
    }
  }

  if (!brandId)
    return (
      <div className="py-16">
        <EmptyState title={t('noBrandTitle')} description={t('noBrandDescription')} />
      </div>
    )
  if (reportId && saved.isPending) return <SectionSkeleton rows={8} />
  if (reportId && saved.isError)
    return (
      <SectionError
        title={t('loadError')}
        retryLabel={t('retry')}
        onRetry={() => void saved.refetch()}
      />
    )

  const steps = [
    {
      id: 1,
      icon: <IconFileText aria-hidden />,
      title: t('steps.details'),
      hint: t('steps.detailsHint'),
    },
    {
      id: 2,
      icon: <IconLayers aria-hidden />,
      title: t('steps.content'),
      hint: t('steps.contentHint'),
    },
    {
      id: 3,
      icon: <IconBarChart aria-hidden />,
      title: t('steps.preview'),
      hint: t('steps.previewHint'),
    },
  ]
  const contentFilter = config.contentFilter ?? {
    types: [...CONTENT_TYPES],
    sortBy: 'views' as const,
  }

  return (
    <div className="-m-4 flex min-h-[calc(100%+2rem)] flex-col md:-m-5 md:min-h-[calc(100%+2.5rem)] xl:-m-6 xl:min-h-[calc(100%+3rem)] xl:flex-row">
      {/* From 1280px a left rail with the back link and the steps; narrower, a bar across the
          top with the steps in a row, so the form keeps the width. */}
      <aside
        className={`shrink-0 border-b border-border-subtle bg-bg-surface-subtle px-4 py-3 transition-[width,padding] duration-drawer ease-standard sm:px-5 xl:border-b-0 xl:border-e xl:pt-2 xl:pb-6 ${
          railCollapsed ? 'xl:w-sidebar-collapsed xl:px-4' : 'xl:w-[320px] xl:px-6'
        }`}
      >
        {/* Sticky inside the page scroll area so the steps stay visible on long steps. */}
        <div className="flex items-center gap-4 xl:sticky xl:top-2 xl:block">
          {/* Back link and the collapse toggle share the top row; collapsed keeps only the toggle. */}
          <div
            className={`flex min-h-8 shrink-0 items-center gap-2 ${railCollapsed ? 'xl:justify-center' : 'xl:justify-between'}`}
          >
            <Link
              to="/reports"
              aria-label={t('back')}
              className={`inline-flex min-h-8 items-center gap-2 rounded-sm text-label-md text-text-secondary outline-none hover:text-text-primary focus-visible:focus-ring ${railCollapsed ? 'xl:hidden' : ''}`}
            >
              <IconArrowLeft aria-hidden />
              <span className="max-sm:hidden">{t('back')}</span>
            </Link>
            {/* Collapsing only applies to the desktop rail. */}
            <Button
              variant="ghost"
              size="sm"
              className="max-xl:hidden"
              aria-label={railCollapsed ? t('steps.expand') : t('steps.collapse')}
              icon={
                <span aria-hidden className="flex items-center text-icon-md text-text-secondary">
                  {railCollapsed ? <IconPanelLeftOpen /> : <IconPanelRightOpen />}
                </span>
              }
              onClick={() => setRailCollapsed((current) => !current)}
            />
          </div>
          <div className="min-w-0 flex-1 xl:mt-8">
            <ReportStepper
              steps={steps}
              current={step}
              reached={reached}
              label={t('steps.label')}
              collapsed={railCollapsed}
              onSelect={(id) => goTo(id as Step)}
            />
          </div>
        </div>
      </aside>

      {/* Right panel: one step at a time. */}
      <main
        className={`min-w-0 flex-1 bg-bg-surface ${step === 3 ? 'px-3 py-4 sm:px-5 lg:px-6 lg:py-6' : 'px-5 py-8 sm:px-8 lg:py-12'}`}
      >
        {step === 1 ? (
          <div className="mx-auto grid max-w-2xl gap-8">
            <ReportStepHeader
              icon={<IconFileText aria-hidden />}
              title={t('details.title')}
              description={t('details.description')}
            />
            <div className="grid gap-6">
              <Input
                label={t('details.name')}
                value={name}
                maxLength={120}
                placeholder={t('details.namePlaceholder')}
                onChange={(event) => {
                  setName(event.target.value)
                  setError('')
                }}
              />
              <ReportTemplatePicker
                label={t('details.template')}
                value={config.template}
                onChange={(template) =>
                  patch({
                    ...defaultReportConfig(template),
                    pageIds: config.pageIds,
                    period: config.period,
                    compare: config.compare,
                  })
                }
              />
              <ReportPagesPicker
                pages={pages}
                value={config.pageIds}
                onChange={(pageIds) => patch({ pageIds })}
              />
              <div className="grid gap-3">
                <span className="text-label-md text-text-secondary">{t('details.period')}</span>
                <DateRangePicker
                  className="w-full"
                  aria-label={t('details.period')}
                  value={periodDates(config.period)}
                  presets={reportDatePresets(t)}
                  onChange={(range) =>
                    range &&
                    patch({ period: { preset: 'custom', since: range[0], until: range[1] } })
                  }
                />
                <Checkbox
                  checked={config.compare}
                  onChange={(event) => patch({ compare: event.target.checked })}
                >
                  {t('details.compare')}
                </Checkbox>
              </div>
            </div>
            <StepFooter
              error={error}
              progress={t('steps.progress', { current: 1, total: TOTAL_STEPS })}
              step={1}
              onNext={() => goTo(2)}
              nextLabel={t('steps.continue')}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mx-auto grid max-w-2xl gap-8">
            <ReportStepHeader
              icon={<IconLayers aria-hidden />}
              title={t('content.title')}
              description={t('content.description')}
            />
            <ReportSectionsEditor
              value={config.sections}
              onChange={(sections) => patch({ sections })}
            />
            {config.sections.some((section) => section.id === 'kpis' && section.enabled) ? (
              <MetricPicker
                title={t('content.kpiMetrics')}
                hint={t('content.metricHint')}
                options={REPORT_METRIC_IDS}
                value={config.kpiMetrics}
                label={(metric) => t(`metrics.${metric}`)}
                onChange={(value) => patch({ kpiMetrics: value })}
              />
            ) : null}
            {config.sections.some((section) => section.id === 'trends' && section.enabled) ? (
              <MetricPicker
                title={t('content.trendMetrics')}
                hint={t('content.metricHint')}
                options={DAILY_METRICS}
                value={config.trendMetrics}
                label={(metric) => t(`metrics.${metric}`)}
                onChange={(value) => patch({ trendMetrics: value })}
              />
            ) : null}
            {config.sections.some(
              (section) =>
                section.enabled &&
                ['content_mix', 'top_posts', 'bottom_posts', 'posts_table', 'best_times'].includes(
                  section.id,
                ),
            ) ? (
              <div className="grid gap-4 rounded-xl border border-border-subtle p-4 sm:grid-cols-2">
                <fieldset className="grid gap-2">
                  <legend className="mb-2 text-label-md text-text-secondary">
                    {t('content.contentTypes')}
                  </legend>
                  {CONTENT_TYPES.map((type) => (
                    <Checkbox
                      key={type}
                      checked={contentFilter.types.includes(type)}
                      onChange={(event) =>
                        patch({
                          contentFilter: {
                            ...contentFilter,
                            types: event.target.checked
                              ? [...contentFilter.types, type]
                              : contentFilter.types.filter((item) => item !== type),
                          },
                        })
                      }
                    >
                      {t(`contentType.${type}`)}
                    </Checkbox>
                  ))}
                </fieldset>
                <Select
                  label={t('content.sortBy')}
                  value={contentFilter.sortBy}
                  showSearch={false}
                  onChange={(event) =>
                    patch({
                      contentFilter: {
                        ...contentFilter,
                        sortBy: event.target.value as 'views' | 'interactions',
                      },
                    })
                  }
                  options={[
                    { value: 'views', label: t('metrics.mediaViews') },
                    { value: 'interactions', label: t('metrics.engagements') },
                  ]}
                />
              </div>
            ) : null}
            <StepFooter
              error={error}
              progress={t('steps.progress', { current: 2, total: TOTAL_STEPS })}
              step={2}
              onBack={() => goTo(1)}
              onNext={() => goTo(3)}
              backLabel={t('steps.back')}
              nextLabel={t('steps.continue')}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mx-auto grid max-w-[88rem] gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<IconArrowLeft aria-hidden />}
                  aria-label={t('steps.back')}
                  onClick={() => goTo(2)}
                />
                <div className="min-w-0">
                  <h1 className="truncate text-heading-3 text-text-primary">
                    {name || t('create')}
                  </h1>
                  {dirty ? (
                    <p className="text-caption text-warning-700">{t('preview.unsaved')}</p>
                  ) : null}
                </div>
              </div>
              {/* Half the row each on a phone. */}
              <div className="flex w-full items-center gap-2 sm:w-auto max-sm:[&>*]:min-w-0 max-sm:[&>*]:flex-1">
                <ReportExportMenu
                  disabled={!preview.data}
                  loading={exporting}
                  onExport={(format) => void exportFile(format)}
                />
                {canManage ? (
                  <Button
                    variant="primary"
                    loading={saving}
                    disabled={!name.trim()}
                    onClick={() => void save()}
                  >
                    {t('preview.save')}
                  </Button>
                ) : null}
              </div>
            </div>
            {preview.isPending ? (
              <SectionSkeleton rows={10} />
            ) : preview.isError ? (
              <SectionError
                title={t('loadError')}
                retryLabel={t('retry')}
                onRetry={() => void preview.refetch()}
              />
            ) : preview.data ? (
              <>
                <ReportFreshnessBar
                  document={preview.data}
                  refresh={refresh}
                  onRefresh={() => void startRefresh()}
                />
                <ReportDataPreview
                  document={preview.data}
                  postsPage={postsPage}
                  onPostsPageChange={setPostsPage}
                />
              </>
            ) : null}
            <ReportStepDots
              total={TOTAL_STEPS}
              current={3}
              label={t('steps.progress', { current: 3, total: TOTAL_STEPS })}
            />
          </div>
        ) : null}
      </main>

      <ConfirmDialog
        open={leaveGuard.blocked}
        title={t('preview.leaveTitle')}
        description={t('preview.leaveDescription')}
        confirmLabel={t('preview.leave')}
        onConfirm={leaveGuard.leave}
        onClose={leaveGuard.stay}
      />
    </div>
  )
}

function MetricPicker<T extends ReportMetricId>({
  title,
  hint,
  options,
  value,
  label,
  onChange,
}: {
  title: string
  hint: string
  options: T[]
  value: T[]
  label: (metric: T) => string
  onChange: (value: T[]) => void
}) {
  return (
    <fieldset className="rounded-xl border border-border-subtle p-4">
      <legend className="px-2 text-label-md text-text-primary">{title}</legend>
      <p className="mb-4 text-caption text-text-tertiary">{hint}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((metric) => (
          <Checkbox
            key={metric}
            checked={value.includes(metric)}
            onChange={(event) =>
              onChange(
                event.target.checked ? [...value, metric] : value.filter((item) => item !== metric),
              )
            }
          >
            {label(metric)}
          </Checkbox>
        ))}
      </div>
    </fieldset>
  )
}

function StepFooter({
  error,
  progress,
  step,
  onBack,
  onNext,
  backLabel,
  nextLabel,
}: {
  error: string
  progress: string
  step: number
  onBack?: () => void
  onNext: () => void
  backLabel?: string
  nextLabel: string
}) {
  return (
    <div className="grid gap-6">
      {error ? (
        <p role="alert" className="text-center text-body-sm text-error-700">
          {error}
        </p>
      ) : null}
      <div className={onBack ? 'grid grid-cols-2 gap-3' : 'grid'}>
        {onBack ? (
          <Button size="lg" className="w-full" onClick={onBack}>
            {backLabel}
          </Button>
        ) : null}
        <Button size="lg" variant="primary" className="w-full" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
      <ReportStepDots total={TOTAL_STEPS} current={step} label={progress} />
    </div>
  )
}

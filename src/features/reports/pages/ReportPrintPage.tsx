import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '../print/print.css'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/shared/ui'
import { getReportPrintData } from '../api/service'
import type { ReportDocument, ReportSection } from '../api/types'
import { PrintSection, usePrintFormat } from '../print/PrintSections'

type PrintWindow = Window & { __REPORT_READY__?: boolean; __REPORT_ERROR__?: string }

/**
 * Page Chromium prints into the report PDF. It is public: the one-time token from the PDF job is
 * the only authorization and exposes just that prepared report. Once data, fonts and charts are
 * on screen it raises `window.__REPORT_READY__` for the renderer.
 */
export default function ReportPrintPage() {
  const { t, i18n } = useTranslation('reports')
  const [params] = useSearchParams()
  const token = params.get('token')
  const data = useQuery({
    queryKey: ['reports', 'print', token],
    queryFn: () => getReportPrintData(token!),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    const win = window as PrintWindow
    if (!token || data.isError) {
      win.__REPORT_ERROR__ = data.isError ? 'print-data' : 'missing-token'
      win.__REPORT_READY__ = true
      return
    }
    if (!data.data) return
    let cancelled = false
    const language = data.data.locale.toLowerCase().startsWith('en') ? 'en-US' : 'vi-VN'
    void i18n
      .changeLanguage(language)
      .then(() => document.fonts?.ready)
      .then(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      )
      .then(() => {
        if (!cancelled) win.__REPORT_READY__ = true
      })
    return () => {
      cancelled = true
    }
  }, [data.data, data.isError, i18n, token])

  if (!token || data.isError)
    return <p className="p-8 text-center text-body-md text-text-secondary">{t('print.invalid')}</p>
  if (!data.data)
    return <p className="p-8 text-center text-body-md text-text-secondary">{t('print.loading')}</p>

  const report = data.data.document
  return (
    <main className="report-print min-h-screen bg-neutral-100 text-text-primary">
      {/* Block flow (not grid gap) so section spacing survives page breaks. */}
      <div className="report-print-sheet space-y-10 bg-bg-surface">
        <Cover document={report} />
        {report.sections.map((section) => (
          <PrintSection key={section.id} section={section} document={report} />
        ))}
        {report.notes.length ? (
          <footer className="grid gap-1 border-t border-border-subtle pt-3 break-inside-avoid">
            <p className="text-[10px] font-semibold text-text-secondary">{t('print.notes')}</p>
            {report.notes.map((note) => (
              <p key={note} className="text-[9px] text-text-tertiary">
                • {t(`notes.${note}` as 'notes.meta_day_boundary', { defaultValue: note })}
              </p>
            ))}
          </footer>
        ) : null}
      </div>
    </main>
  )
}

/** First page: brand band with the report identity, then the key metrics. */
function Cover({ document }: { document: ReportDocument }) {
  const { t } = useTranslation('reports')
  const format = usePrintFormat(document.meta.timeZone)
  const { meta, freshness } = document
  const kpis = document.sections.find(
    (section): section is Extract<ReportSection, { id: 'kpis' }> => section.id === 'kpis',
  )
  return (
    <section className="grid gap-5 break-inside-avoid">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-8 py-8 text-text-inverse">
        <span
          aria-hidden
          className="absolute -end-16 -top-16 size-24 rounded-full bg-text-inverse opacity-10"
        />
        <span
          aria-hidden
          className="absolute -bottom-20 end-16 size-24 rounded-full bg-text-inverse opacity-5"
        />
        <div className="relative flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-bg-surface">
              <Logo size="sm" />
            </span>
            <span className="text-label-md font-semibold">SocialOps</span>
          </span>
          <span className="rounded-pill border border-brand-300 px-3 py-1 text-[10px] uppercase tracking-caps text-brand-100">
            {t('print.eyebrow')}
          </span>
        </div>
        <div className="relative mt-8 grid gap-2">
          <p className="text-[11px] uppercase tracking-caps text-brand-200">
            {t(`templates.${meta.template}`)}
          </p>
          <h1 className="text-display-sm leading-tight">{meta.title}</h1>
        </div>
        <dl className="relative mt-6 grid grid-cols-3 gap-4 border-t border-brand-500 pt-4 text-[11px]">
          <CoverFact label={t('print.preparedFor')} value={meta.brand.name} />
          <CoverFact
            label={t('print.period')}
            value={`${format.date(meta.period.since)} – ${format.date(meta.period.until)}`}
          />
          {meta.previousPeriod ? (
            <CoverFact
              label={t('print.compared')}
              value={`${format.date(meta.previousPeriod.since)} – ${format.date(meta.previousPeriod.until)}`}
            />
          ) : (
            <CoverFact label={t('print.pages')} value={String(meta.pages.length)} />
          )}
        </dl>
      </div>

      {kpis?.items.length ? (
        <div className="grid grid-cols-4 gap-3">
          {kpis.items.map((item) => {
            const up = (item.changePct ?? 0) >= 0
            return (
              <div
                key={item.metric}
                className="grid content-start gap-1 rounded-xl border border-border-subtle p-3"
              >
                <p className="text-[10px] text-text-tertiary">
                  {t(`metrics.${item.metric}` as 'metrics.mediaViews', {
                    defaultValue: item.metric,
                  })}
                </p>
                <p className="text-heading-2 tabular-nums text-text-primary">
                  {item.metric === 'engagementRate' || item.metric === 'followerGrowthPct'
                    ? format.percent(item.value)
                    : format.compact(item.value)}
                </p>
                {item.changePct !== null ? (
                  <span
                    className={`w-fit rounded-pill px-2 text-[9px] font-semibold tabular-nums ${
                      item.changePct === 0
                        ? 'bg-neutral-100 text-text-secondary'
                        : up
                          ? 'bg-success-50 text-success-700'
                          : 'bg-error-50 text-error-700'
                    }`}
                  >
                    {item.changePct === 0
                      ? t('print.noChange')
                      : `${up ? '↑' : '↓'} ${format.percent(Math.abs(item.changePct))}`}
                  </span>
                ) : null}
                {item.previous !== null ? (
                  <p className="text-[9px] text-text-tertiary">
                    {t('print.previous', {
                      value:
                        item.metric === 'engagementRate' || item.metric === 'followerGrowthPct'
                          ? format.percent(item.previous)
                          : format.compact(item.previous),
                    })}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2 text-[10px] text-text-tertiary">
        <span className="flex flex-wrap items-center gap-1">
          <span className="font-semibold text-text-secondary">{t('print.pages')}:</span>
          {meta.pages.map((page) => page.name).join(' · ')}
        </span>
        <span className="flex flex-wrap gap-3">
          <span>{t('print.generated', { time: format.dateTime(meta.generatedAt) })}</span>
          {freshness.lastSyncedAt ? (
            <span>{t('print.synced', { time: format.dateTime(freshness.lastSyncedAt) })}</span>
          ) : null}
          <span>{t('print.timeZone', { timeZone: meta.timeZone })}</span>
        </span>
      </div>
    </section>
  )
}

function CoverFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-brand-200">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}

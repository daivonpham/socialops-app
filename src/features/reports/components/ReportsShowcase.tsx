import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IconBarChart,
  IconCalendar,
  IconDownload,
  IconFile,
  IconFileText,
  IconGrid,
  IconImage,
  IconTable,
} from '@/shared/ui'

/**
 * One introduction panel for the Reports page: what a report covers on the left and a
 * sample report on the right. The sample numbers are illustrative and hidden from
 * assistive technology.
 */
export function ReportsShowcase() {
  const { t } = useTranslation('reports')
  return (
    <section
      aria-label={t('showcase.label')}
      className="relative overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-brand-50 via-bg-surface to-bg-surface"
    >
      <div className="grid gap-10 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-12 lg:p-10">
        <div className="grid gap-6">
          <div className="grid gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-pill border border-brand-100 bg-bg-surface px-3 py-1 text-label-sm text-brand-700">
              <IconBarChart aria-hidden />
              {t('showcase.eyebrow')}
            </span>
            <h2 className="text-display-sm text-text-primary">{t('showcase.title')}</h2>
            <p className="max-w-[480px] text-body-md text-text-secondary">
              {t('showcase.description')}
            </p>
          </div>

          <ul className="grid gap-4">
            <Feature
              icon={<IconGrid aria-hidden />}
              title={t('showcase.pagesTitle')}
              description={t('showcase.pagesDescription')}
            />
            <Feature
              icon={<IconImage aria-hidden />}
              title={t('showcase.contentTitle')}
              description={t('showcase.contentDescription')}
            />
            <Feature
              icon={<IconDownload aria-hidden />}
              title={t('showcase.exportTitle')}
              description={t('showcase.exportDescription')}
            />
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption text-text-tertiary">{t('showcase.formats')}</span>
            <FormatChip icon={<IconTable aria-hidden />} label="Excel" />
            <FormatChip icon={<IconFileText aria-hidden />} label="CSV" />
            <FormatChip icon={<IconFile aria-hidden />} label="PDF" muted />
            <FormatChip icon={<IconGrid aria-hidden />} label="Google Sheets" muted />
          </div>
        </div>

        <SampleReport />
      </div>
    </section>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <li className="flex gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-surface text-icon-md text-brand-600 shadow-xs">
        {icon}
      </span>
      <div className="grid gap-1">
        <p className="text-label-md text-text-primary">{title}</p>
        <p className="text-body-sm text-text-tertiary">{description}</p>
      </div>
    </li>
  )
}

function FormatChip({
  icon,
  label,
  muted = false,
}: {
  icon: ReactNode
  label: string
  muted?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill border border-border-subtle px-3 py-1 text-label-sm ${
        muted ? 'bg-bg-surface-subtle text-text-tertiary' : 'bg-bg-surface text-text-secondary'
      }`}
    >
      {icon}
      {label}
    </span>
  )
}

/** Miniature report: header, KPIs, Page comparison and a top post, plus an export chip. */
function SampleReport() {
  const { t } = useTranslation('reports')
  const kpis = [
    { label: t('showcase.sampleViews'), value: '252.5K', change: '+18.2%' },
    { label: t('showcase.sampleInteractions'), value: '24.1K', change: '+12.4%' },
    { label: t('showcase.sampleFollowers'), value: '+1,280', change: '+8.2%' },
  ]
  const pages = [
    { name: 'Coffee House', value: '124.8K', width: 'w-full' },
    { name: 'Tea Corner', value: '86.2K', width: 'w-8/12' },
    { name: 'Bakery Lab', value: '41.5K', width: 'w-4/12' },
  ]
  return (
    // A drawing of a report: too small to read on a phone, so it shows from 640px.
    <div aria-hidden className="relative hidden pb-6 pe-4 sm:block sm:pe-6">
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface shadow-lg">
        <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div className="grid gap-1">
            <p className="text-label-sm uppercase tracking-caps text-brand-700">
              {t('templates.period_overview')}
            </p>
            <p className="text-heading-4 text-text-primary">{t('showcase.sampleFile')}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-1 text-caption text-text-secondary">
            <IconCalendar />
            01/10 – 31/10
          </span>
        </div>

        <div className="grid gap-5 p-5">
          <div className="grid grid-cols-3 gap-3">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="grid gap-1 rounded-lg border border-border-subtle p-3"
              >
                <p className="truncate text-caption text-text-tertiary">{kpi.label}</p>
                <p className="text-heading-4 tabular-nums text-text-primary">{kpi.value}</p>
                <span className="w-fit rounded-pill bg-success-50 px-2 text-label-sm tabular-nums text-success-700">
                  ↑ {kpi.change}
                </span>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="grid gap-3 rounded-lg border border-border-subtle p-4">
              <div className="flex items-center justify-between text-caption text-text-tertiary">
                <span>{t('showcase.samplePages')}</span>
                <span>{t('showcase.sampleViews')}</span>
              </div>
              {pages.map((page) => (
                <div key={page.name} className="grid gap-1">
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-secondary">{page.name}</span>
                    <span className="tabular-nums text-text-primary">{page.value}</span>
                  </div>
                  <span className="block h-2 rounded-pill bg-bg-surface-muted">
                    <span className={`block h-2 rounded-pill bg-brand-500 ${page.width}`} />
                  </span>
                </div>
              ))}
            </div>

            <div className="grid content-start gap-3 rounded-lg border border-border-subtle p-4">
              <div className="flex items-center justify-between text-caption text-text-tertiary">
                <span>{t('showcase.sampleTopPost')}</span>
                <span className="text-label-sm text-brand-700">#1</span>
              </div>
              <div className="h-16 rounded-lg bg-gradient-to-br from-brand-100 to-brand-50" />
              <div className="grid gap-2">
                <span className="block h-2 w-11/12 rounded-pill bg-bg-surface-muted" />
                <span className="block h-2 w-7/12 rounded-pill bg-bg-surface-muted" />
              </div>
              <div className="flex justify-between text-caption">
                <span className="tabular-nums text-text-primary">32K</span>
                <span className="tabular-nums text-text-primary">4.8K</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 end-0 flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface py-3 ps-3 pe-4 shadow-lg">
        <span className="flex size-10 items-center justify-center rounded-lg bg-success-50 text-icon-md text-success-700">
          <IconTable />
        </span>
        <div className="grid">
          <p className="text-label-md text-text-primary">bao-cao-thang-10.xlsx</p>
          <p className="text-caption text-text-tertiary">{t('showcase.sampleExported')}</p>
        </div>
      </div>
    </div>
  )
}

import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { color } from '@/shared/styles/tokens'
import { IconCalendar, IconCheck, IconClock, IconImage, IconView, IconWarning } from '@/shared/ui'
import type { ReportTemplate } from '../api/types'
import { REPORT_TEMPLATES } from '../model/report-config'

const TEMPLATES = Object.keys(REPORT_TEMPLATES) as ReportTemplate[]

/** Template cards with a small illustration of what each report looks like. */
export function ReportTemplatePicker({
  value,
  onChange,
  label,
}: {
  value: ReportTemplate
  onChange: (template: ReportTemplate) => void
  label: string
}) {
  const { t } = useTranslation('reports')
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-label-md text-text-secondary">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {TEMPLATES.map((template) => {
          const selected = template === value
          return (
            <label
              key={template}
              className={`group grid cursor-pointer overflow-hidden rounded-xl border bg-bg-surface transition-colors has-[:focus-visible]:focus-ring ${
                selected
                  ? 'border-brand-600 ring-1 ring-brand-600'
                  : 'border-border-subtle hover:border-border-strong'
              }`}
            >
              <input
                type="radio"
                name="report-template"
                value={template}
                checked={selected}
                className="sr-only"
                onChange={() => onChange(template)}
              />
              <span
                aria-hidden
                className={`flex h-[148px] items-end justify-center border-b px-5 pt-5 ${selected ? 'border-brand-100 bg-brand-50' : 'border-border-subtle bg-bg-surface-subtle'}`}
              >
                <TemplateArt template={template} />
              </span>
              <span className="grid gap-1 p-3">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-label-md text-text-primary">
                    {t(`templates.${template}`)}
                  </span>
                  <span
                    aria-hidden
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-brand-600' : 'border-border-strong'}`}
                  >
                    {selected ? <span className="size-2 rounded-full bg-brand-600" /> : null}
                  </span>
                </span>
                <span className="text-caption text-text-tertiary">
                  {t(`templateDescriptions.${template}`)}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Miniature report page drawn with tokens; purely decorative. */
function TemplateArt({ template }: { template: ReportTemplate }) {
  return (
    <span className="grid w-full max-w-[248px] gap-3 rounded-t-lg border border-b-0 border-border-subtle bg-bg-surface px-3 pt-3 pb-3 shadow-md">
      <span className="flex items-center justify-between">
        <span className="grid gap-1">
          <span className="block h-[6px] w-16 rounded-pill bg-neutral-300" />
          <span className="block h-[4px] w-10 rounded-pill bg-neutral-200" />
        </span>
        <span className="flex items-center gap-1 rounded-pill border border-border-subtle px-2 py-[2px] text-[9px] text-text-tertiary">
          <IconCalendar />
          30d
        </span>
      </span>
      {template === 'period_overview' ? <OverviewArt /> : null}
      {template === 'page_performance' ? <PagesArt /> : null}
      {template === 'content_performance' ? <ContentArt /> : null}
      {template === 'publishing_activity' ? <PublishingArt /> : null}
    </span>
  )
}

/** KPI tiles over a trend line with the previous period dashed. */
function OverviewArt() {
  const gradientId = useId()
  return (
    <span className="grid gap-2">
      <span className="grid grid-cols-3 gap-2">
        {['+18%', '+12%', '+8%'].map((change) => (
          <span key={change} className="grid gap-1 rounded-md border border-border-subtle p-2">
            <span className="block h-[4px] w-8 rounded-pill bg-neutral-200" />
            <span className="block h-[6px] w-10 rounded-pill bg-neutral-400" />
            <span className="text-[8px] font-semibold leading-none text-success-700">
              ↑ {change}
            </span>
          </span>
        ))}
      </span>
      <svg viewBox="0 0 220 44" className="h-10 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color.brand[300]} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color.brand[300]} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points="0,34 30,30 60,32 90,24 120,27 150,18 180,20 220,10"
          fill="none"
          className="stroke-neutral-300"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <path
          d="M0,30 L30,24 L60,27 L90,16 L120,19 L150,9 L180,12 L220,4 L220,44 L0,44 Z"
          fill={`url(#${gradientId})`}
        />
        <polyline
          points="0,30 30,24 60,27 90,16 120,19 150,9 180,12 220,4"
          fill="none"
          className="stroke-brand-500"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

/** A ranked table of Pages with avatars, values and bars. */
function PagesArt() {
  const rows = [
    { tone: 'bg-brand-500', width: 'w-full' },
    { tone: 'bg-info-500', width: 'w-8/12' },
    { tone: 'bg-warning-500', width: 'w-5/12' },
    { tone: 'bg-neutral-400', width: 'w-3/12' },
  ]
  return (
    <span className="grid gap-2">
      {rows.map((row, index) => (
        <span
          key={row.tone}
          className="grid grid-cols-[14px_minmax(0,1fr)_28px] items-center gap-2"
        >
          <span
            className={`flex size-[14px] items-center justify-center rounded-full text-[7px] font-semibold text-text-inverse ${row.tone}`}
          >
            {index + 1}
          </span>
          <span className="grid gap-1">
            <span className="block h-[4px] w-12 rounded-pill bg-neutral-300" />
            <span className="block h-[5px] rounded-pill bg-bg-surface-muted">
              <span className={`block h-[5px] rounded-pill bg-brand-500 ${row.width}`} />
            </span>
          </span>
          <span className="block h-[5px] rounded-pill bg-neutral-300" />
        </span>
      ))}
    </span>
  )
}

/** Three ranked post cards with a thumbnail and their results. */
function ContentArt() {
  return (
    <span className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((rank) => (
        <span key={rank} className="grid gap-1 rounded-md border border-border-subtle p-1">
          <span className="relative flex h-10 items-center justify-center rounded-sm bg-gradient-to-br from-brand-200 to-brand-50 text-[12px] text-brand-700">
            <IconImage />
            <span className="absolute start-1 top-1 rounded-pill bg-bg-surface px-1 text-[7px] font-semibold leading-[12px] text-text-primary">
              #{rank}
            </span>
          </span>
          <span className="block h-[4px] w-10/12 rounded-pill bg-neutral-300" />
          <span className="flex items-center gap-1 text-[8px] text-text-tertiary">
            <IconView />
            <span className="block h-[4px] flex-1 rounded-pill bg-brand-400" />
          </span>
        </span>
      ))}
    </span>
  )
}

/** A publishing timeline: published, scheduled and failed posts. */
function PublishingArt() {
  const rows = [
    { icon: <IconCheck />, tone: 'bg-success-50 text-success-700', pill: 'bg-success-500' },
    { icon: <IconClock />, tone: 'bg-info-50 text-info-700', pill: 'bg-info-500' },
    { icon: <IconWarning />, tone: 'bg-error-50 text-error-700', pill: 'bg-error-500' },
  ]
  return (
    <span className="grid gap-2">
      {rows.map((row) => (
        <span
          key={row.pill}
          className="flex items-center gap-2 rounded-md border border-border-subtle px-2 py-1"
        >
          <span
            className={`flex size-[18px] shrink-0 items-center justify-center rounded-sm text-[10px] ${row.tone}`}
          >
            {row.icon}
          </span>
          <span className="grid flex-1 gap-1">
            <span className="block h-[4px] w-11/12 rounded-pill bg-neutral-300" />
            <span className="block h-[4px] w-6/12 rounded-pill bg-neutral-200" />
          </span>
          <span className={`block h-[6px] w-5 rounded-pill ${row.pill}`} />
        </span>
      ))}
    </span>
  )
}

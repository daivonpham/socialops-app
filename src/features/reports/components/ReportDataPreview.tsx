import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatCountryLabel,
  formatDate,
  formatDateTime,
  formatNumber,
  resolveLocale,
} from '@/shared/i18n'
import {
  Button,
  IconBarChart,
  IconCalendar,
  IconFileText,
  IconGrid,
  IconImage,
  IconLayers,
  IconMembers,
  IconTable,
  IconTrendingUp,
} from '@/shared/ui'
import type { ReportCellFormat, ReportDocument, ReportTable } from '../api/types'

const PAGE_SIZE = 50

const TABLE_ICONS: Record<string, ReactNode> = {
  kpis: <IconGrid aria-hidden />,
  daily: <IconCalendar aria-hidden />,
  trends: <IconTrendingUp aria-hidden />,
  pages: <IconTable aria-hidden />,
  top_pages: <IconBarChart aria-hidden />,
  audience_countries: <IconMembers aria-hidden />,
  audience_cities: <IconMembers aria-hidden />,
  content_mix: <IconLayers aria-hidden />,
  top_posts: <IconImage aria-hidden />,
  bottom_posts: <IconImage aria-hidden />,
  posts: <IconFileText aria-hidden />,
  best_times: <IconCalendar aria-hidden />,
  publishing_summary: <IconFileText aria-hidden />,
  publishing: <IconFileText aria-hidden />,
}

/**
 * Step 3 preview: the tables an export will contain, as a compact spreadsheet. Each item on the
 * left is one Excel sheet (or one CSV); the grid on the right shows its exact columns and values.
 */
export function ReportDataPreview({
  document,
  postsPage,
  onPostsPageChange,
}: {
  document: ReportDocument
  postsPage: number
  onPostsPageChange: (page: number) => void
}) {
  const { t, i18n } = useTranslation('reports')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const tables = document.tables ?? []
  const [selected, setSelected] = useState<string | null>(null)
  const table = tables.find((item) => item.kind === selected) ?? tables[0]
  const { meta } = document

  return (
    <div className="grid gap-3">
      <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-border-subtle bg-bg-surface-subtle px-3 py-2 text-caption">
        <Fact label={t('preview.brand')} value={meta.brand.name} />
        <Fact label={t('details.template')} value={t(`templates.${meta.template}`)} />
        <Fact
          label={t('details.period')}
          value={`${formatDate(meta.period.since, locale)} – ${formatDate(meta.period.until, locale)}`}
        />
        {meta.previousPeriod ? (
          <Fact
            label={t('preview.previousPeriod')}
            value={`${formatDate(meta.previousPeriod.since, locale)} – ${formatDate(meta.previousPeriod.until, locale)}`}
          />
        ) : null}
        <Fact
          label={t('details.pages')}
          value={t('preview.pagesCount', { count: meta.pages.length })}
          title={meta.pages.map((page) => page.name).join(', ')}
        />
        <Fact label={t('preview.timeZoneLabel')} value={meta.timeZone} />
      </dl>

      {tables.length && table ? (
        <div className="grid min-h-[480px] overflow-hidden rounded-lg border border-border-subtle lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav
            aria-label={t('preview.fileContents')}
            className="border-b border-border-subtle bg-bg-surface-subtle lg:border-b-0 lg:border-e"
          >
            <div className="px-3 pt-3 pb-2">
              <p className="text-label-sm text-text-primary">{t('preview.fileContents')}</p>
              <p className="text-caption text-text-tertiary">{t('preview.fileContentsHint')}</p>
            </div>
            <ul className="flex gap-1 overflow-x-auto px-2 pb-2 lg:grid lg:overflow-visible">
              {tables.map((item) => {
                const active = item.kind === table.kind
                return (
                  <li key={item.kind} className="shrink-0">
                    <button
                      type="button"
                      aria-current={active ? 'true' : undefined}
                      onClick={() => setSelected(item.kind)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left outline-none focus-visible:focus-ring ${
                        active
                          ? 'bg-bg-surface text-text-primary shadow-xs ring-1 ring-border-subtle'
                          : 'text-text-secondary hover:bg-bg-surface'
                      }`}
                    >
                      <span
                        className={`text-icon-sm ${active ? 'text-brand-600' : 'text-text-tertiary'}`}
                      >
                        {TABLE_ICONS[item.kind] ?? <IconTable aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-label-sm">{item.name}</span>
                      <span className="rounded-pill bg-bg-surface-muted px-2 text-caption tabular-nums text-text-tertiary">
                        {item.totalRows ?? item.rows.length}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <DataGrid
            table={table}
            locale={locale}
            timeZone={meta.timeZone}
            page={table.kind === 'posts' ? postsPage : 1}
            onPageChange={table.kind === 'posts' ? onPostsPageChange : undefined}
          />
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border-subtle px-4 py-8 text-center text-body-sm text-text-tertiary">
          {t('preview.noTables')}
        </p>
      )}

      {document.notes.length ? (
        <div className="grid gap-1 text-caption text-text-tertiary">
          <p className="text-label-sm text-text-secondary">{t('preview.dataNotes')}</p>
          {document.notes.map((note) => (
            <p key={note}>
              • {t(`notes.${note}` as 'notes.meta_day_boundary', { defaultValue: note })}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Fact({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="flex items-center gap-1" title={title}>
      <dt className="text-text-tertiary">{label}:</dt>
      <dd className="text-label-sm text-text-primary">{value}</dd>
    </div>
  )
}

function DataGrid({
  table,
  locale,
  timeZone,
  page,
  onPageChange,
}: {
  table: ReportTable
  locale: string
  timeZone: string
  page: number
  onPageChange?: (page: number) => void
}) {
  const { t } = useTranslation('reports')
  const total = table.totalRows ?? table.rows.length
  const format = (value: string | number | null, kind: ReportCellFormat): ReactNode => {
    if (value === null || value === '') return <span className="text-text-disabled">—</span>
    if (typeof value === 'number') {
      if (kind === 'percent')
        return `${formatNumber(value * 100, resolveLocale(locale), { maximumFractionDigits: 1 })}%`
      return formatNumber(value, resolveLocale(locale), { maximumFractionDigits: 2 })
    }
    if (kind === 'date') return formatDate(value, locale)
    if (kind === 'datetime') return formatDateTime(value, locale, timeZone)
    if (kind === 'country') return formatCountryLabel(value, locale)
    if (kind === 'url')
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:text-link-hover"
        >
          {t('preview.open')}
        </a>
      )
    return value
  }
  const numeric = (kind: ReportCellFormat) => kind === 'number' || kind === 'percent'

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-3 py-2">
        <p className="truncate text-label-md text-text-primary">{table.name}</p>
        <p className="shrink-0 text-caption text-text-tertiary">
          {t('preview.rows', { count: total })} ·{' '}
          {t('preview.columns', { count: table.columns.length })}
        </p>
      </div>
      {table.rows.length ? (
        <div className="app-scrollbar max-h-[560px] flex-1 overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-body-sm">
            <thead>
              <tr>
                {table.columns.map((column, index) => (
                  <th
                    key={column}
                    scope="col"
                    className={`sticky top-0 z-10 border-b border-border-subtle bg-bg-surface-subtle px-3 py-2 text-label-sm whitespace-nowrap text-text-secondary ${
                      numeric(table.formats[index] ?? 'text') ? 'text-end' : 'text-start'
                    } ${index === 0 ? 'left-0 z-20' : ''}`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-bg-surface-subtle">
                  {row.map((value, columnIndex) => {
                    const kind =
                      table.rowFormats?.[rowIndex]?.[columnIndex] ??
                      table.formats[columnIndex] ??
                      'text'
                    return (
                      <td
                        key={columnIndex}
                        className={`border-b border-border-subtle px-3 py-2 ${
                          numeric(kind) ? 'text-end tabular-nums whitespace-nowrap' : 'text-start'
                        } ${
                          kind === 'text' && columnIndex > 0
                            ? 'max-w-[320px] truncate'
                            : 'whitespace-nowrap'
                        } ${columnIndex === 0 ? 'sticky left-0 bg-bg-surface text-text-primary' : 'text-text-secondary'}`}
                        title={typeof value === 'string' && kind === 'text' ? value : undefined}
                      >
                        {format(value, kind)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-3 py-8 text-center text-body-sm text-text-tertiary">
          {t('preview.emptyTable')}
        </p>
      )}
      {total > table.rows.length ? (
        <div className="flex items-center justify-between gap-3 border-t border-border-subtle px-3 py-2">
          <p className="text-caption text-text-tertiary">
            {t('preview.showingRows', { shown: table.rows.length, total })}
          </p>
          {onPageChange ? (
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                ‹
              </Button>
              <span className="text-caption tabular-nums text-text-secondary">{page}</span>
              <Button
                size="sm"
                disabled={page * PAGE_SIZE >= total}
                onClick={() => onPageChange(page + 1)}
              >
                ›
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

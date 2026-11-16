import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatCityLabel,
  formatCountryLabel,
  formatDate,
  formatDateTime,
  formatNumber,
  resolveLocale,
} from '@/shared/i18n'
import type { ReportDocument, ReportPost, ReportSection } from '../api/types'
import { PrintBarList, PrintHeatmap, PrintLineChart } from './print-charts'

/** Long tables are capped in the PDF; the Excel file keeps every row. */
const MAX_TABLE_ROWS = 200
const PERCENT_METRICS = new Set(['engagementRate', 'followerGrowthPct'])

export type PrintFormat = {
  number: (value: number | null | undefined) => string
  compact: (value: number | null | undefined) => string
  percent: (value: number | null | undefined) => string
  metric: (metric: string, value: number | null | undefined) => string
  date: (value: string) => string
  dateTime: (value: string) => string
}

export function usePrintFormat(timeZone: string): PrintFormat {
  const { i18n } = useTranslation('reports')
  const locale = resolveLocale(i18n.resolvedLanguage ?? i18n.language)
  const empty = '—'
  const number = (value: number | null | undefined) =>
    value === null || value === undefined
      ? empty
      : formatNumber(value, locale, { maximumFractionDigits: 1 })
  const percent = (value: number | null | undefined) =>
    value === null || value === undefined
      ? empty
      : `${formatNumber(value * 100, locale, { maximumFractionDigits: 1 })}%`
  return {
    number,
    percent,
    compact: (value) =>
      value === null || value === undefined
        ? empty
        : formatNumber(value, locale, {
            notation: Math.abs(value) >= 10_000 ? 'compact' : 'standard',
            maximumFractionDigits: 1,
          }),
    metric: (metric, value) => (PERCENT_METRICS.has(metric) ? percent(value) : number(value)),
    date: (value) => formatDate(value, locale),
    dateTime: (value) => formatDateTime(value, locale, timeZone),
  }
}

/** Section heading: accent bar, title, one-line description. */
function Section({
  id,
  children,
  avoidBreak = false,
}: {
  id: ReportSection['id']
  children: ReactNode
  avoidBreak?: boolean
}) {
  const { t } = useTranslation('reports')
  return (
    <section className={`space-y-3 ${avoidBreak ? 'break-inside-avoid' : ''}`}>
      <header className="flex items-end justify-between gap-4 border-b border-border-subtle pb-2 break-after-avoid">
        <h2 className="flex items-center gap-2 text-heading-4 text-text-primary">
          <span className="block h-5 w-1 rounded-pill bg-brand-600" />
          {t(`sectionNames.${id}`)}
        </h2>
        <p className="max-w-[60%] text-end text-[10px] text-text-tertiary">
          {t(`sectionDescriptions.${id}`)}
        </p>
      </header>
      {children}
    </section>
  )
}

function Empty() {
  const { t } = useTranslation('reports')
  return (
    <p className="rounded-lg border border-dashed border-border-subtle px-3 py-4 text-center text-[11px] text-text-tertiary">
      {t('print.empty')}
    </p>
  )
}

function Truncated({ shown, total }: { shown: number; total: number }) {
  const { t } = useTranslation('reports')
  return total > shown ? (
    <p className="text-[10px] text-text-tertiary">{t('print.truncated', { shown, total })}</p>
  ) : null
}

/** Compact table with a shaded header, zebra rows and right-aligned numbers. */
function Table({
  columns,
  rows,
  numeric,
  footer,
}: {
  columns: string[]
  rows: ReactNode[][]
  numeric: boolean[]
  footer?: ReactNode[]
}) {
  // Wide tables (e.g. every metric per Page) shrink so headers stay on one or two lines.
  const dense = columns.length > 8
  return (
    <table className={`w-full border-collapse ${dense ? 'text-[8px]' : 'text-[10px]'}`}>
      <thead>
        <tr className="bg-neutral-100">
          {columns.map((column, index) => (
            <th
              key={column}
              className={`border-b border-border-subtle py-2 align-bottom leading-tight font-semibold text-text-secondary ${dense ? 'px-1' : 'px-2'} ${numeric[index] ? 'text-end' : 'text-start'}`}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="break-inside-avoid even:bg-neutral-50">
            {row.map((cell, index) => (
              <td
                key={index}
                className={`border-b border-neutral-100 py-2 align-middle ${dense ? 'px-1' : 'px-2'} ${numeric[index] ? 'text-end tabular-nums whitespace-nowrap text-text-secondary' : 'text-start text-text-primary'}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer ? (
        <tfoot>
          <tr className="bg-brand-50 font-semibold">
            {footer.map((cell, index) => (
              <td
                key={index}
                className={`border-t border-brand-200 py-2 ${dense ? 'px-1' : 'px-2'} ${numeric[index] ? 'text-end tabular-nums' : 'text-start'}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        </tfoot>
      ) : null}
    </table>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function PageName({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[8px] font-semibold text-brand-800">
        {initials(name)}
      </span>
      <span className="truncate">{name}</span>
    </span>
  )
}

/** Post text clamped to two lines, with its Page as a muted second line. */
function ContentCell({ text, pageName }: { text: string; pageName: string }) {
  return (
    <span className="grid gap-1">
      <span className="line-clamp-2">{text}</span>
      <span className="text-[9px] text-text-tertiary">{pageName}</span>
    </span>
  )
}

function PostCard({
  post,
  rank,
  format,
}: {
  post: ReportPost
  rank?: number
  format: PrintFormat
}) {
  const { t } = useTranslation('reports')
  const stats: Array<[string, string]> = [
    [t('metrics.mediaViews'), format.number(post.views)],
    [t('metrics.reactions'), format.number(post.reactions)],
    [t('metrics.comments'), format.number(post.comments)],
    [t('metrics.shares'), format.number(post.shares)],
    [t('metrics.engagementRate'), format.percent(post.engagementRate)],
  ]
  return (
    <article className="flex gap-3 rounded-lg border border-border-subtle px-3 py-2 break-inside-avoid">
      {rank ? (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-text-inverse">
          {rank}
        </span>
      ) : null}
      <div className="grid min-w-0 flex-1 gap-2">
        <div className="grid gap-1">
          <p className="line-clamp-2 text-[11px] text-text-primary">
            {post.message || t(`contentType.${post.type}`)}
          </p>
          <p className="text-[9px] text-text-tertiary">
            {post.pageName} · {t(`contentType.${post.type}`)} · {t(`mediaType.${post.mediaType}`)} ·{' '}
            {format.dateTime(post.publishedAt)}
          </p>
        </div>
        <dl className="grid grid-cols-5 gap-2 rounded-md bg-neutral-50 px-2 py-1">
          {stats.map(([label, value]) => (
            <div key={label} className="grid">
              <dt className="text-[8px] text-text-tertiary">{label}</dt>
              <dd className="text-[11px] font-semibold tabular-nums text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  )
}

/** One report section laid out for A4 print. KPIs are drawn on the cover instead. */
export function PrintSection({
  section,
  document,
}: {
  section: ReportSection
  document: ReportDocument
}) {
  const { t, i18n } = useTranslation('reports')
  const format = usePrintFormat(document.meta.timeZone)
  const pageNames = new Map(document.meta.pages.map((page) => [page.id, page.name]))
  const label = (metric: string) =>
    t(`metrics.${metric}` as 'metrics.mediaViews', { defaultValue: metric })
  const hasPrevious = Boolean(document.meta.previousPeriod)

  switch (section.id) {
    case 'kpis':
      return null
    case 'trends':
      return (
        <Section id={section.id}>
          <div className="grid grid-cols-2 gap-4">
            {section.lines.map((line) => (
              <div
                key={line.metric}
                className="rounded-lg border border-border-subtle p-3 break-inside-avoid"
              >
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <p className="text-[11px] font-semibold text-text-primary">
                    {label(line.metric)}
                  </p>
                  <p className="text-[11px] tabular-nums text-text-secondary">
                    {format.compact(
                      line.series.reduce((sum, point) => sum + (point.value ?? 0), 0),
                    )}
                  </p>
                </div>
                <PrintLineChart
                  points={line.series.map((point) => ({
                    label: format.date(point.date),
                    value: point.value,
                    previous: point.previous,
                  }))}
                  format={(value) => format.compact(value)}
                  currentLabel={t('print.thisPeriod')}
                  previousLabel={hasPrevious ? t('preview.previousPeriod') : undefined}
                />
              </div>
            ))}
          </div>
        </Section>
      )
    case 'daily_table': {
      const metrics = Object.keys(section.rows[0]?.metrics ?? {})
      const rows = section.rows.slice(0, MAX_TABLE_ROWS)
      return (
        <Section id={section.id}>
          <Table
            columns={[t('preview.date'), ...metrics.map(label)]}
            numeric={[false, ...metrics.map(() => true)]}
            rows={rows.map((row) => [
              format.date(row.date),
              ...metrics.map((metric) =>
                format.metric(metric, row.metrics[metric as keyof typeof row.metrics]),
              ),
            ])}
          />
          <Truncated shown={rows.length} total={section.rows.length} />
        </Section>
      )
    }
    case 'pages_table': {
      const metrics = Object.keys(section.total)
      return (
        <Section id={section.id}>
          {section.rows.length ? (
            <Table
              columns={[t('list.pages'), ...metrics.map(label)]}
              numeric={[false, ...metrics.map(() => true)]}
              rows={section.rows.map((row) => [
                <PageName key="page" name={pageNames.get(row.pageId) ?? row.pageId} />,
                ...metrics.map((metric) =>
                  format.metric(metric, row.metrics[metric as keyof typeof row.metrics]),
                ),
              ])}
              footer={[
                t('print.total'),
                ...metrics.map((metric) =>
                  format.metric(metric, section.total[metric as keyof typeof section.total]),
                ),
              ]}
            />
          ) : (
            <Empty />
          )}
        </Section>
      )
    }
    case 'top_pages':
      return (
        <Section id={section.id} avoidBreak>
          {section.rows.length ? (
            <PrintBarList
              rows={section.rows.map((row) => ({
                label: pageNames.get(row.pageId) ?? row.pageId,
                value: row.value,
                share: format.percent(row.share),
              }))}
              format={(value) => format.compact(value)}
            />
          ) : (
            <Empty />
          )}
        </Section>
      )
    case 'audience':
      return (
        <Section id={section.id}>
          <div className="grid grid-cols-2 gap-6">
            {(
              [
                [
                  t('print.countries'),
                  section.countries.map((row) => ({
                    label: formatCountryLabel(row.code, i18n.language),
                    value: row.value,
                  })),
                ],
                [
                  t('print.cities'),
                  section.cities.map((row) => ({
                    label: formatCityLabel(row.name, i18n.language),
                    value: row.value,
                  })),
                ],
              ] as const
            ).map(([title, rows]) => (
              <div key={title} className="grid content-start gap-2 break-inside-avoid">
                <p className="text-[11px] font-semibold text-text-primary">{title}</p>
                {rows.length ? (
                  <PrintBarList rows={[...rows]} format={(value) => format.compact(value)} />
                ) : (
                  <Empty />
                )}
              </div>
            ))}
          </div>
        </Section>
      )
    case 'content_mix':
      return (
        <Section id={section.id}>
          <p className="text-[11px] font-semibold text-text-primary">{t('print.byType')}</p>
          <div className="grid grid-cols-3 gap-3 break-inside-avoid">
            {section.byType.map((row) => (
              <div key={row.type} className="rounded-lg border border-border-subtle p-3">
                <p className="text-[11px] font-semibold text-text-primary">
                  {t(`contentType.${row.type}`)}
                </p>
                <p className="mt-1 text-heading-3 tabular-nums text-text-primary">
                  {format.number(row.posts)}
                </p>
                <dl className="mt-2 grid gap-1 text-[10px]">
                  {(
                    [
                      [t('metrics.mediaViews'), format.compact(row.views)],
                      [t('metrics.engagements'), format.compact(row.interactions)],
                      [t('metrics.engagementRate'), format.percent(row.engagementRate)],
                    ] as const
                  ).map(([name, value]) => (
                    <div key={name} className="flex justify-between gap-2">
                      <dt className="text-text-tertiary">{name}</dt>
                      <dd className="tabular-nums text-text-primary">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-semibold text-text-primary">{t('print.byMedia')}</p>
          <Table
            columns={[
              t('print.format'),
              t('metrics.posts'),
              t('metrics.mediaViews'),
              t('metrics.engagements'),
            ]}
            numeric={[false, true, true, true]}
            rows={section.byMedia.map((row) => [
              t(`mediaType.${row.type}`),
              format.number(row.posts),
              format.number(row.views),
              format.number(row.interactions),
            ])}
          />
        </Section>
      )
    case 'top_posts':
    case 'bottom_posts':
      return (
        <Section id={section.id}>
          {section.rows.length ? (
            <div className="grid gap-2">
              {section.rows.map((post, index) => (
                <PostCard key={post.id} post={post} rank={index + 1} format={format} />
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Section>
      )
    case 'posts_table': {
      const rows = section.rows.slice(0, MAX_TABLE_ROWS)
      return (
        <Section id={section.id}>
          {rows.length ? (
            <Table
              columns={[
                t('print.content'),
                t('preview.date'),
                t('metrics.mediaViews'),
                t('metrics.reactions'),
                t('metrics.comments'),
                t('metrics.shares'),
                t('metrics.engagementRate'),
              ]}
              numeric={[false, false, true, true, true, true, true]}
              rows={rows.map((post) => [
                <ContentCell
                  key="content"
                  text={post.message || t(`contentType.${post.type}`)}
                  pageName={post.pageName}
                />,
                <span key="date" className="whitespace-nowrap">
                  {format.dateTime(post.publishedAt)}
                </span>,
                format.number(post.views),
                format.number(post.reactions),
                format.number(post.comments),
                format.number(post.shares),
                format.percent(post.engagementRate),
              ])}
            />
          ) : (
            <Empty />
          )}
          <Truncated shown={rows.length} total={section.total} />
        </Section>
      )
    }
    case 'best_times': {
      const weekdays = Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(
          new Date(Date.UTC(2026, 0, 4 + index)),
        ),
      )
      return (
        <Section id={section.id} avoidBreak>
          <PrintHeatmap
            cells={section.cells.map((cell) => ({
              weekday: cell.weekday,
              hour: cell.hour,
              value: cell.avgInteractions,
            }))}
            weekdays={weekdays}
            lowLabel={t('print.low')}
            highLabel={t('print.high')}
          />
        </Section>
      )
    }
    case 'publishing_summary': {
      const items = [
        'published',
        'scheduled',
        'inProgress',
        'failed',
        'needsAction',
        'drafts',
        'pendingApproval',
      ] as const
      const tone: Partial<Record<(typeof items)[number], string>> = {
        published: 'text-success-700',
        failed: 'text-error-700',
        needsAction: 'text-warning-700',
      }
      return (
        <Section id={section.id} avoidBreak>
          <div className="grid grid-cols-4 gap-2">
            {items.map((key) => (
              <div key={key} className="rounded-lg border border-border-subtle px-3 py-2">
                <p className="text-[10px] text-text-tertiary">{t(`publishingStatus.${key}`)}</p>
                <p className={`text-heading-3 tabular-nums ${tone[key] ?? 'text-text-primary'}`}>
                  {format.number(section[key])}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )
    }
    case 'publishing_table': {
      const rows = section.rows.slice(0, MAX_TABLE_ROWS)
      const statusTone = (status: string) =>
        status === 'published'
          ? 'bg-success-50 text-success-700'
          : status === 'failed'
            ? 'bg-error-50 text-error-700'
            : status === 'scheduled'
              ? 'bg-info-50 text-info-700'
              : 'bg-neutral-100 text-text-secondary'
      return (
        <Section id={section.id}>
          {rows.length ? (
            <Table
              columns={[t('print.content'), t('preview.date'), t('print.status')]}
              numeric={[false, false, false]}
              rows={rows.map((row) => [
                <ContentCell key="content" text={row.caption || '—'} pageName={row.pageName} />,
                <span key="date" className="whitespace-nowrap">
                  {row.publishedAt || row.scheduledAt
                    ? format.dateTime((row.publishedAt ?? row.scheduledAt)!)
                    : '—'}
                </span>,
                <span
                  key="status"
                  className={`inline-block rounded-pill px-2 text-[9px] whitespace-nowrap ${statusTone(row.status)}`}
                >
                  {t(`publishingStatus.${row.status}` as 'publishingStatus.published', {
                    defaultValue: row.status,
                  })}
                </span>,
              ])}
            />
          ) : (
            <Empty />
          )}
          <Truncated shown={rows.length} total={section.total} />
        </Section>
      )
    }
  }
}

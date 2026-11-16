import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate, type AppLocale } from '@/shared/i18n'
import { Avatar, DataTable, Sparkline, type ChartTone, type DataTableColumn } from '@/shared/ui'
import type { FacebookDashboardDto, FacebookPageDto } from '../../api'
import { ChangePill, DashboardCard } from './DashboardCard'
import { formatCompact, formatPercent, formatSigned } from './format'

type PageRow = FacebookDashboardDto['pages'][number] & { page?: FacebookPageDto }

const SPARK_TONES: ChartTone[] = ['primary', 'accent', 'info']

export function PagePerformanceCard({
  rows,
  pages,
  compare,
  onSelectPage,
}: {
  rows: FacebookDashboardDto['pages']
  /** Connected Pages, for their health. */
  pages: FacebookPageDto[]
  compare: boolean
  onSelectPage: (pageId: string) => void
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const data = useMemo<PageRow[]>(() => {
    const byId = new Map(pages.map((page) => [page.id, page]))
    return rows.map((row) => ({ ...row, page: byId.get(row.pageId) }))
  }, [pages, rows])

  const columns = useMemo<DataTableColumn<PageRow>[]>(() => {
    const number = (
      key: keyof FacebookDashboardDto['pages'][number],
      format: (row: PageRow) => string,
      extra?: (row: PageRow) => React.ReactNode,
    ): DataTableColumn<PageRow> => ({
      key,
      dataIndex: key,
      title: t(`dashboard.pages.${key as 'followers'}`),
      width: 'compact',
      align: 'end',
      render: (_, row) => (
        <span className="inline-grid justify-items-end gap-1">
          <span className="text-body-sm tabular-nums text-text-primary">{format(row)}</span>
          {extra?.(row)}
        </span>
      ),
    })
    return [
      {
        key: 'page',
        dataIndex: 'pageName',
        title: t('dashboard.pages.page'),
        width: 'wide',
        render: (_, row) => {
          const health = row.page?.health ?? 'connected'
          return (
            <span className="flex min-w-0 items-center gap-3">
              <Avatar name={row.pageName} src={row.avatarUrl} size="sm" />
              <span className="grid min-w-0 gap-[2px]">
                <span className="truncate text-label-md text-text-primary">{row.pageName}</span>
                <span
                  className={`flex items-center gap-1 text-caption ${health === 'connected' ? 'text-brand-700' : 'text-accent-700'}`}
                >
                  <span aria-hidden className="size-[6px] rounded-full bg-current" />
                  {health === 'connected'
                    ? t('dashboard.pages.active')
                    : health === 'token_expiring' && row.page?.reconnectBy
                      ? t('dashboard.pages.expiring', {
                          date: formatDate(row.page.reconnectBy, locale),
                        })
                      : t('dashboard.pages.needsReconnect')}
                </span>
              </span>
            </span>
          )
        },
      },
      number('followers', (row) => formatCompact(row.followers, locale)),
      number('netFollows', (row) => formatSigned(row.netFollows, locale)),
      number(
        'viewers',
        (row) => formatCompact(row.viewers, locale),
        compare ? (row) => <ChangePill change={row.viewersChange} locale={locale} /> : undefined,
      ),
      number('engagements', (row) => formatCompact(row.engagements, locale)),
      number('engagementRate', (row) => formatPercent(row.engagementRate, locale)),
      number('posts', (row) => formatCompact(row.posts, locale)),
      number('pageViews', (row) => formatCompact(row.pageViews, locale)),
      {
        key: 'trend',
        title: t('dashboard.pages.trend'),
        width: 'default',
        render: (_, row) => (
          <Sparkline
            values={row.viewersSeries}
            tone={SPARK_TONES[data.indexOf(row) % SPARK_TONES.length]}
            className="h-8 w-32"
          />
        ),
      },
    ]
  }, [compare, data, locale, t])

  return (
    <DashboardCard
      title={t('dashboard.pages.title')}
      hint={t('dashboard.engagementRateFormula')}
      description={t('dashboard.pages.description')}
    >
      <div className="-mx-5 -mb-5">
        <DataTable
          data={data}
          columns={columns}
          getRowId={(row) => row.pageId}
          ariaLabel={t('dashboard.pages.title')}
          onRowClick={(row) => onSelectPage(row.pageId)}
        />
      </div>
    </DashboardCard>
  )
}

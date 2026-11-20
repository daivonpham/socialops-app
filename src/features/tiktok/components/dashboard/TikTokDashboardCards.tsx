import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDate, formatNumber, type AppLocale } from '@/shared/i18n'
import {
  WEEKDAY_KEYS as DAYS,
  formatCompact,
  formatDayMonth,
  formatNumberText,
  formatPercent,
  formatSigned,
  formatSlot,
} from '@/shared/lib/analyticsFormat'
import {
  AreaTrendChart,
  Avatar,
  CHART_TONE_CLASS,
  ChangePill,
  DashboardCard,
  DataTable,
  DivergingBarChart,
  DonutChart,
  IconClock,
  IconTikTok,
  IconTrendingUp,
  IconVideo,
  Image,
  Progress,
  Sparkline,
  Tabs,
  Tooltip,
  type ChartTone,
  type DataTableColumn,
} from '@/shared/ui'
import type { TikTokAccountDto, TikTokDashboardDto, TikTokDashboardVideoDto } from '../../api'
import { tiktokVideoDetailPath } from '../../config/tiktok.routes'
import { HEALTH_TONE } from '../../model/health'

type Dashboard = TikTokDashboardDto

const TREND_METRICS = ['views', 'engagements', 'likes', 'comments', 'shares'] as const
type TrendMetric = (typeof TREND_METRICS)[number]

/** `2026-10-09` moved by `days` days, as a `YYYY-MM-DD` key. */
function shiftDay(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
}

export function TikTokTrendCard({
  dashboard,
  compare,
  className,
}: {
  dashboard: Dashboard
  compare: boolean
  className?: string
}) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const [metric, setMetric] = useState<TrendMetric>('views')
  const series = dashboard.trend[metric]
  const labels = dashboard.trend.labels
  const total = series.current.reduce((sum, value) => sum + value, 0)
  const peakIndex = series.current.reduce(
    (best, value, index, values) => (value > (values[best] ?? 0) ? index : best),
    0,
  )
  const metricLabel = t(`dashboard.trend.metrics.${metric}`)
  const range = (from?: string, to?: string) =>
    from && to ? ` · ${formatDayMonth(from)} – ${formatDayMonth(to)}` : ''
  const previousLabels = labels.map((label) => shiftDay(label, -labels.length))

  return (
    <DashboardCard
      className={className}
      title={t('dashboard.trend.title')}
      description={t('dashboard.trend.description')}
      extra={
        // Five metrics do not fit a phone: they scroll sideways inside the card, not the page.
        <Tabs
          className="app-scrollbar -mx-1 max-w-[calc(100%+0.5rem)] overflow-x-auto px-1 py-px"
          value={metric}
          ariaLabel={t('dashboard.trend.metric')}
          onChange={setMetric}
          options={TREND_METRICS.map((value) => ({
            value,
            label: t(`dashboard.trend.metrics.${value}`),
          }))}
        />
      }
    >
      <dl className="flex flex-wrap gap-x-8 gap-y-4 sm:gap-x-10">
        <div className="grid gap-1">
          <dt className="text-caption text-text-tertiary">
            {t('dashboard.trend.total', { metric: metricLabel.toLowerCase() })}
          </dt>
          <dd className="flex items-center gap-2">
            <span className="text-heading-1 tabular-nums text-text-primary">
              {formatCompact(total, locale)}
            </span>
            {compare ? <ChangePill change={dashboard.kpis[metric].change} locale={locale} /> : null}
          </dd>
        </div>
        <div className="grid gap-1 sm:border-s sm:border-border-subtle sm:ps-5">
          <dt className="text-caption text-text-tertiary">{t('dashboard.trend.average')}</dt>
          <dd className="text-heading-3 tabular-nums text-text-primary">
            {formatCompact(labels.length ? total / labels.length : 0, locale)}
          </dd>
        </div>
        <div className="grid gap-1 sm:border-s sm:border-border-subtle sm:ps-5">
          <dt className="text-caption text-text-tertiary">{t('dashboard.trend.peak')}</dt>
          <dd className="text-heading-3 tabular-nums text-text-primary">
            {labels[peakIndex] && total
              ? `${formatDayMonth(labels[peakIndex])} · ${formatCompact(series.current[peakIndex] ?? 0, locale)}`
              : '—'}
          </dd>
        </div>
      </dl>
      <AreaTrendChart
        ariaLabel={t('dashboard.trend.title')}
        data={labels.map((label, index) => ({
          label,
          current: series.current[index] ?? 0,
          previous: series.previous[index] ?? 0,
        }))}
        currentLabel={`${t('dashboard.currentPeriod')}${range(labels[0], labels.at(-1))}`}
        previousLabel={
          compare
            ? `${t('dashboard.previousPeriod')}${range(previousLabels[0], previousLabels.at(-1))}`
            : undefined
        }
        valueFormatter={(value) => formatCompact(value, locale)}
        labelFormatter={formatDayMonth}
      />
    </DashboardCard>
  )
}

const PARTS = [
  { key: 'likes', tone: 'primary' },
  { key: 'comments', tone: 'primarySoft' },
  { key: 'shares', tone: 'accent' },
] as const satisfies ReadonlyArray<{ key: string; tone: ChartTone }>

export function TikTokInteractionMixCard({
  interactions,
  className,
}: {
  interactions: Dashboard['interactions']
  className?: string
}) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const total = PARTS.reduce((sum, part) => sum + interactions[part.key], 0)
  const share = (value: number) =>
    total ? `${formatNumber(Math.round((value / total) * 100), locale)}%` : '0%'

  return (
    <DashboardCard
      className={className}
      title={t('dashboard.interactions.title')}
      description={t('dashboard.interactions.description')}
    >
      <DonutChart
        ariaLabel={t('dashboard.interactions.title')}
        data={PARTS.map((part) => ({
          key: part.key,
          label: t(`dashboard.interactions.${part.key}`),
          value: interactions[part.key],
          tone: part.tone,
        }))}
        valueFormatter={(value, percent) =>
          `${formatNumber(value, locale)} · ${formatNumber(Math.round(percent), locale)}%`
        }
        center={
          <>
            <span className="text-heading-1 tabular-nums text-text-primary">
              {formatCompact(total, locale)}
            </span>
            <span className="text-caption text-text-tertiary">
              {t('dashboard.interactions.total')}
            </span>
          </>
        }
      />
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PARTS.map((part) => (
          <li key={part.key} className="rounded-lg border border-border-subtle px-3 py-2">
            <span className="flex items-center gap-2 text-caption text-text-tertiary">
              <span aria-hidden className={`size-2 rounded-full ${CHART_TONE_CLASS[part.tone]}`} />
              {t(`dashboard.interactions.${part.key}`)}
            </span>
            <span className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-label-md tabular-nums text-text-primary">
                {formatCompact(interactions[part.key], locale)}
              </span>
              <span className="text-caption tabular-nums text-text-tertiary">
                {share(interactions[part.key])}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  )
}

export function TikTokFollowerGrowthCard({
  followers,
  className,
}: {
  followers: Dashboard['followers']
  className?: string
}) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const range =
    followers.labels.length > 0
      ? `${formatDayMonth(followers.labels[0]!)} – ${formatDayMonth(followers.labels.at(-1)!)}`
      : ''
  const best = Math.max(0, ...followers.net)
  const worst = Math.min(0, ...followers.net)
  const tiles = [
    {
      key: 'gained',
      value: formatSigned(best, locale),
      className: 'bg-brand-50 text-brand-700',
    },
    {
      key: 'lost',
      value: formatSigned(worst, locale),
      className: 'bg-accent-50 text-accent-700',
    },
    {
      key: 'net',
      value: formatSigned(followers.change, locale),
      className: 'bg-bg-surface-muted text-text-primary',
    },
  ] as const

  return (
    <DashboardCard
      className={className}
      title={t('dashboard.followers.title')}
      description={t('dashboard.followers.description', { range })}
      extra={
        <span className="rounded-pill bg-brand-50 px-3 py-1 text-caption font-semibold text-brand-700">
          {t('dashboard.followers.total', { value: formatCompact(followers.total, locale) })}
        </span>
      }
    >
      <dl className="grid grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <div key={tile.key} className={`grid gap-1 rounded-lg px-3 py-2 ${tile.className}`}>
            <dt className="text-caption opacity-80">{t(`dashboard.followers.${tile.key}`)}</dt>
            <dd className="text-heading-3 tabular-nums">{tile.value}</dd>
          </div>
        ))}
      </dl>
      <DivergingBarChart
        ariaLabel={t('dashboard.followers.title')}
        data={followers.labels.map((label, index) => {
          const net = followers.net[index] ?? 0
          return { label, positive: Math.max(0, net), negative: Math.max(0, -net) }
        })}
        positiveLabel={t('dashboard.followers.gains')}
        negativeLabel={t('dashboard.followers.losses')}
        valueFormatter={(value) => formatCompact(value, locale)}
        labelFormatter={formatDayMonth}
      />
    </DashboardCard>
  )
}

const SLOTS = Array.from({ length: 12 }, (_, slot) => slot)
/** Five intensity steps, faint to strong primary green; the first also fills empty slots. */
const LEVELS = ['bg-brand-50', 'bg-brand-100', 'bg-brand-300', 'bg-brand-500', 'bg-brand-700']

export function TikTokPostingTimesCard({
  postingTimes,
  className,
}: {
  postingTimes: Dashboard['postingTimes']
  className?: string
}) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const cells = new Map(postingTimes.cells.map((cell) => [`${cell.day}:${cell.slot}`, cell]))
  const maxRate = Math.max(...postingTimes.cells.map((cell) => cell.engagementRate), 0)
  const level = (rate: number) =>
    LEVELS[maxRate ? Math.max(1, Math.round((rate / maxRate) * (LEVELS.length - 1))) : 1]
  const best = postingTimes.best
  const bestSlot = best ? formatSlot(best.slot) : null

  return (
    <DashboardCard
      className={className}
      title={t('dashboard.postingTimes.title')}
      hint={t('dashboard.engagementRateFormula')}
      description={t('dashboard.postingTimes.description')}
      extra={
        best && bestSlot ? (
          <span className="inline-flex items-center gap-2 rounded-pill bg-action-primary px-4 py-2 text-label-md text-text-inverse">
            <IconClock aria-hidden />
            {t('dashboard.postingTimes.best', {
              day: t(`dashboard.postingTimes.longDays.${DAYS[best.day] ?? 'mon'}`),
              ...bestSlot,
            })}
          </span>
        ) : undefined
      }
    >
      {!best ? (
        <p className="text-body-sm text-text-tertiary">{t('dashboard.postingTimes.noData')}</p>
      ) : null}
      {/* The padding keeps the best slot's ring inside the scroll box, which clips overflow. */}
      <div className="-m-1 overflow-x-auto p-1">
        <div className="grid min-w-[480px] grid-cols-[2.5rem_repeat(12,minmax(0,1fr))] gap-2">
          <span />
          {SLOTS.map((slot) => (
            <span key={slot} className="text-center text-caption text-text-tertiary">
              {formatSlot(slot).from.replace(/^0(?=\d)/, '')}
            </span>
          ))}
          {DAYS.map((dayKey, day) => (
            <div key={dayKey} className="contents">
              <span className="self-center text-label-md text-text-secondary">
                {t(`dashboard.postingTimes.days.${dayKey}`)}
              </span>
              {SLOTS.map((slot) => {
                const cell = cells.get(`${day}:${slot}`)
                const isBest = best?.day === day && best.slot === slot
                const box = (
                  <span
                    className={`block h-10 rounded-lg ${cell ? level(cell.engagementRate) : LEVELS[0]} ${isBest ? 'ring-2 ring-action-primary ring-offset-2' : cell?.videos === 1 ? 'opacity-50' : ''}`}
                  />
                )
                return cell ? (
                  <Tooltip
                    key={slot}
                    title={t('dashboard.postingTimes.cell', {
                      day: t(`dashboard.postingTimes.longDays.${dayKey}`),
                      ...formatSlot(slot),
                      videos: cell.videos,
                      rate: formatPercent(cell.engagementRate, locale),
                    })}
                  >
                    {box}
                  </Tooltip>
                ) : (
                  <span key={slot}>{box}</span>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden className="flex items-center gap-2 text-caption text-text-tertiary">
        {t('dashboard.postingTimes.less')}
        {LEVELS.map((className) => (
          <span key={className} className={`h-3 w-6 rounded-sm ${className}`} />
        ))}
        {t('dashboard.postingTimes.more')}
        <span className="ms-3">{t('dashboard.postingTimes.singlePost')}</span>
      </div>
    </DashboardCard>
  )
}

export function TikTokDurationCard({
  durations,
  className,
}: {
  durations: Dashboard['durations']
  className?: string
}) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const sorted = durations
    .filter((item) => item.videos > 0)
    .sort((left, right) => right.engagementRate - left.engagementRate)
  const maxRate = sorted[0]?.engagementRate ?? 0
  const videos = durations.reduce((sum, item) => sum + item.videos, 0)

  return (
    <DashboardCard
      className={className}
      title={t('dashboard.durations.title')}
      hint={t('dashboard.engagementRateFormula')}
      description={t('dashboard.durations.description', { count: videos })}
    >
      {sorted.length ? (
        <ul className="grid gap-4">
          {sorted.map((item, index) => (
            <li key={item.bucket} className="grid gap-2">
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-body-sm">
                  <strong className="font-semibold text-text-primary">
                    {t(`dashboard.durations.names.${item.bucket}`)}
                  </strong>{' '}
                  <span className="text-caption text-text-tertiary">
                    {t('dashboard.durations.summary', {
                      count: item.videos,
                      value: formatCompact(item.averageViews, locale),
                    })}
                  </span>
                </span>
                <span className="shrink-0 text-label-md tabular-nums text-text-primary">
                  {formatPercent(item.engagementRate, locale, 1)}
                </span>
              </span>
              <Progress
                percent={maxRate ? (item.engagementRate / maxRate) * 100 : 0}
                tone={index === 0 ? 'primary' : index < 3 ? 'soft' : 'muted'}
                ariaLabel={t(`dashboard.durations.names.${item.bucket}`)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-text-tertiary">{t('dashboard.durations.empty')}</p>
      )}
    </DashboardCard>
  )
}

type AccountRow = Dashboard['accounts'][number] & { account?: TikTokAccountDto }
const SPARK_TONES: ChartTone[] = ['primary', 'accent', 'info']

export function TikTokAccountPerformanceCard({
  rows,
  accounts,
  compare,
  onSelectAccount,
}: {
  rows: Dashboard['accounts']
  /** Connected accounts, for their health. */
  accounts: TikTokAccountDto[]
  compare: boolean
  onSelectAccount: (accountId: string) => void
}) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const data = useMemo<AccountRow[]>(() => {
    const byId = new Map(accounts.map((account) => [account.id, account]))
    return rows.map((row) => ({ ...row, account: byId.get(row.accountId) }))
  }, [accounts, rows])

  const columns = useMemo<DataTableColumn<AccountRow>[]>(() => {
    const number = (
      key: 'followers' | 'netFollowers' | 'views' | 'engagements' | 'engagementRate' | 'videos',
      format: (row: AccountRow) => string,
      extra?: (row: AccountRow) => ReactNode,
    ): DataTableColumn<AccountRow> => ({
      key,
      dataIndex: key,
      title: t(`dashboard.accounts.${key}`),
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
        key: 'account',
        dataIndex: 'name',
        title: t('dashboard.accounts.account'),
        width: 'wide',
        render: (_, row) => {
          const health = row.account?.health ?? 'connected'
          return (
            <span className="flex min-w-0 items-center gap-3">
              <Avatar name={row.name} src={row.avatarUrl} size="sm" />
              <span className="grid min-w-0 gap-[2px]">
                <span className="truncate text-label-md text-text-primary">{row.name}</span>
                <span
                  className={`flex items-center gap-1 text-caption ${HEALTH_TONE[health] === 'success' ? 'text-brand-700' : 'text-accent-700'}`}
                >
                  <span aria-hidden className="size-[6px] rounded-full bg-current" />
                  {health === 'token_expiring' && row.account?.refreshExpiresAt
                    ? t('health.token_expiring', {
                        date: formatDate(row.account.refreshExpiresAt, locale),
                      })
                    : t(`health.${health}`)}
                </span>
              </span>
            </span>
          )
        },
      },
      number('followers', (row) => formatCompact(row.followers, locale)),
      number('netFollowers', (row) => formatSigned(row.netFollowers, locale)),
      number(
        'views',
        (row) => formatCompact(row.views, locale),
        compare ? (row) => <ChangePill change={row.viewsChange} locale={locale} /> : undefined,
      ),
      number('engagements', (row) => formatCompact(row.engagements, locale)),
      number('engagementRate', (row) => formatPercent(row.engagementRate, locale)),
      number('videos', (row) => formatCompact(row.videos, locale)),
      {
        key: 'trend',
        title: t('dashboard.accounts.trend'),
        width: 'default',
        render: (_, row) => (
          <Sparkline
            values={row.viewsSeries}
            tone={SPARK_TONES[data.indexOf(row) % SPARK_TONES.length]}
            className="h-8 w-32"
          />
        ),
      },
    ]
  }, [compare, data, locale, t])

  return (
    <DashboardCard
      title={t('dashboard.accounts.title')}
      hint={t('dashboard.engagementRateFormula')}
      description={t('dashboard.accounts.description')}
    >
      <div className="-mx-5 -mb-5">
        <DataTable
          data={data}
          columns={columns}
          getRowId={(row) => row.accountId}
          ariaLabel={t('dashboard.accounts.title')}
          onRowClick={(row) => onSelectAccount(row.accountId)}
        />
      </div>
    </DashboardCard>
  )
}

const SORTS = ['views', 'engagements', 'engagementRate'] as const
type Sort = (typeof SORTS)[number]

export function TikTokTopVideosCard({
  topVideos,
  className,
}: {
  topVideos: Dashboard['topVideos']
  className?: string
}) {
  const { t } = useTranslation('tiktok')
  const [sort, setSort] = useState<Sort>('views')
  const videos = topVideos[sort]

  return (
    <DashboardCard
      className={className}
      title={t('dashboard.topVideos.title')}
      hint={t('dashboard.engagementRateFormula')}
      description={t('dashboard.topVideos.description')}
      extra={
        <Tabs
          value={sort}
          ariaLabel={t('dashboard.topVideos.sortBy')}
          onChange={setSort}
          options={SORTS.map((value) => ({ value, label: t(`dashboard.topVideos.${value}`) }))}
        />
      }
    >
      {videos.length ? (
        <ol className="grid gap-3">
          {videos.map((video, index) => (
            <TopVideoRow key={video.id} video={video} rank={index + 1} />
          ))}
        </ol>
      ) : (
        <p className="text-body-sm text-text-tertiary">{t('dashboard.topVideos.empty')}</p>
      )}
    </DashboardCard>
  )
}

function TopVideoRow({ video, rank }: { video: TikTokDashboardVideoDto; rank: number }) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const stats = [
    { key: 'views', value: formatCompact(video.views, locale) },
    { key: 'likes', value: formatCompact(video.likes, locale) },
    { key: 'comments', value: formatCompact(video.comments, locale) },
    { key: 'engagements', value: formatCompact(video.engagements, locale) },
    { key: 'engagementRate', value: formatPercent(video.engagementRate, locale, 1), strong: true },
  ] as const

  return (
    <li>
      <Link
        to={tiktokVideoDetailPath(video.id)}
        title={t('dashboard.topVideos.open')}
        className="flex items-center gap-3 rounded-lg border border-border-subtle px-3 py-2 transition-colors duration-fast hover:bg-bg-surface-subtle focus-visible:focus-ring"
      >
        <span className="w-4 shrink-0 text-center text-label-md text-text-tertiary">{rank}</span>
        {/* TikTok covers are 9:16. */}
        <span className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg-surface-muted text-icon-md text-text-tertiary">
          {video.coverImageUrl ? (
            <Image
              src={video.coverImageUrl}
              alt=""
              preview={false}
              wrapperClassName="size-full"
              className="size-full object-cover"
            />
          ) : (
            <IconVideo aria-hidden />
          )}
        </span>
        <span className="grid min-w-0 flex-1 gap-1">
          <span className="truncate text-label-md text-text-primary">
            {video.title || t('dashboard.topVideos.noTitle')}
          </span>
          <span className="flex min-w-0 items-center gap-2 text-caption text-text-tertiary">
            <IconTikTok aria-hidden className="shrink-0 text-platform-tiktok" />
            <span className="truncate">
              {video.accountName} · {formatDate(video.createdAt, locale)}
            </span>
          </span>
        </span>
        <dl className="hidden shrink-0 grid-cols-5 gap-4 md:grid">
          {stats.map((stat) => (
            <div key={stat.key} className="grid w-16 justify-items-end gap-[2px]">
              <dt className="text-caption text-text-tertiary">
                {t(`dashboard.topVideos.${stat.key}`)}
              </dt>
              <dd
                className={`text-label-md tabular-nums ${'strong' in stat ? 'text-brand-700' : 'text-text-primary'}`}
              >
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </Link>
    </li>
  )
}

/** A few rule-based takeaways from the period. */
export function TikTokHighlightsCard({
  dashboard,
  compare,
  className = '',
}: {
  dashboard: Dashboard
  compare: boolean
  className?: string
}) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const items: Array<{ key: string; label: string; value: string; detail: string }> = []

  const views = dashboard.kpis.views
  const series = dashboard.trend.views.current
  const peak = series.reduce(
    (best, value, index) => (value > (series[best] ?? 0) ? index : best),
    0,
  )
  if (views.value > 0) {
    const change = formatNumberText(Math.abs(views.change ?? 0), locale)
    items.push({
      key: 'views',
      label: t(compare ? 'dashboard.highlights.viewsChange' : 'dashboard.highlights.viewsTotal'),
      value:
        !compare || views.change === null
          ? formatCompact(views.value, locale)
          : views.change > 0
            ? t('dashboard.highlights.viewsUp', { value: `${change}%` })
            : views.change < 0
              ? t('dashboard.highlights.viewsDown', { value: `${change}%` })
              : t('dashboard.highlights.viewsFlat'),
      detail: t('dashboard.highlights.viewsDetail', {
        value: formatCompact(views.value, locale),
        day: formatDayMonth(dashboard.trend.labels[peak] ?? ''),
      }),
    })
  }

  const bestLength = [...dashboard.durations]
    .filter((item) => item.videos > 0)
    .sort((left, right) => right.engagementRate - left.engagementRate)[0]
  if (bestLength && bestLength.engagementRate > 0) {
    items.push({
      key: 'length',
      label: t('dashboard.highlights.bestLength'),
      value: t('dashboard.highlights.bestLengthValue', {
        length: t(`dashboard.durations.names.${bestLength.bucket}`),
        rate: formatPercent(bestLength.engagementRate, locale, 1),
      }),
      detail: t('dashboard.highlights.bestLengthDetail'),
    })
  }

  const best = dashboard.postingTimes.best
  if (best) {
    const slot = formatSlot(best.slot)
    items.push({
      key: 'time',
      label: t('dashboard.highlights.bestTime'),
      value: `${t(`dashboard.postingTimes.longDays.${DAYS[best.day] ?? 'mon'}`)} ${slot.from}–${slot.to}`,
      detail: t('dashboard.highlights.bestTimeDetail'),
    })
  }

  const top = dashboard.topVideos.views[0]
  if (top) {
    items.push({
      key: 'video',
      label: t('dashboard.highlights.topVideo'),
      value: top.title || t('dashboard.topVideos.noTitle'),
      detail: t('dashboard.highlights.topVideoDetail', {
        views: formatCompact(top.views, locale),
        rate: formatPercent(top.engagementRate, locale, 1),
      }),
    })
  }

  return (
    <section
      className={`flex min-w-0 flex-col gap-4 rounded-xl border border-brand-100 bg-brand-50 p-5 ${className}`}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-lg bg-bg-surface text-icon-md text-brand-700"
        >
          <IconTrendingUp />
        </span>
        <h2 className="text-heading-3 text-text-primary">{t('dashboard.highlights.title')}</h2>
      </header>
      {items.length ? (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.key} className="grid gap-1 rounded-lg bg-bg-surface px-4 py-3 shadow-xs">
              <span className="text-caption font-medium text-brand-700">{item.label}</span>
              <span className="line-clamp-2 text-label-md text-text-primary">{item.value}</span>
              <span className="text-caption text-text-tertiary">{item.detail}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-text-tertiary">{t('dashboard.highlights.empty')}</p>
      )}
    </section>
  )
}

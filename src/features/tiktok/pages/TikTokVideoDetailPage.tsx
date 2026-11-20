import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { TikTokPostPreview } from '@/features/planning'
import { isApiErrorCode } from '@/shared/api/errors'
import { formatDate, formatDateTime, formatNumber, type AppLocale } from '@/shared/i18n'
import { formatCompact, formatDayMonth, formatPercent } from '@/shared/lib/analyticsFormat'
import { useActiveBrand } from '@/shared/scope'
import {
  Alert,
  Button,
  DashboardCard,
  DonutChart,
  EmptyState,
  IconArrowLeft,
  IconComment,
  IconHeart,
  IconOpen,
  IconShare,
  IconView,
  LineChart,
  SectionError,
  Spin,
  Tooltip,
  type ChartTone,
} from '@/shared/ui'
import { useTikTokVideo, type TikTokVideoDetailDto } from '../api'
import { TIKTOK_ROUTES } from '../config/tiktok.routes'
import { formatVideoLength } from '../model/format'

/** Everything SocialOps has synced for one TikTok video, laid out like the Facebook post details. */
export default function TikTokVideoDetailPage() {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const { videoId } = useParams<{ videoId: string }>()
  const { brandId } = useActiveBrand()
  const navigate = useNavigate()
  const location = useLocation()
  const detail = useTikTokVideo(brandId, videoId ?? null)
  // Back to the Videos list as it was left; opened directly, back to its default view.
  const from = (location.state as { from?: string } | null)?.from
  const goBack = () =>
    navigate(`${TIKTOK_ROUTES.OVERVIEW}${from ?? '?tab=videos'}`, { replace: Boolean(from) })

  const header = (
    <header className="flex items-center gap-3">
      <Button icon={<IconArrowLeft />} aria-label={t('detail.back')} onClick={goBack} />
      <h1 className="text-heading-2 font-semibold text-text-primary">{t('detail.title')}</h1>
    </header>
  )

  if (detail.isPending)
    return (
      <div className="grid gap-6">
        {header}
        <div className="flex justify-center py-24" aria-label={t('common.loading')}>
          <Spin size="lg" />
        </div>
      </div>
    )
  if (detail.isError)
    return (
      <div className="grid gap-6">
        {header}
        {isApiErrorCode(detail.error, 'RESOURCE_NOT_FOUND') ? (
          <EmptyState
            title={t('detail.notFound')}
            description={t('detail.notFoundDescription')}
            action={<Button onClick={goBack}>{t('detail.back')}</Button>}
          />
        ) : (
          <SectionError
            title={t('detail.loadError')}
            retryLabel={t('common.retry')}
            onRetry={() => void detail.refetch()}
          />
        )}
      </div>
    )

  const data = detail.data
  const { video } = data

  return (
    <div className="grid gap-6">
      {header}
      {data.removed ? (
        <Alert
          variant="soft"
          tone="warning"
          title={t('detail.removed')}
          description={t('detail.removedDescription')}
        />
      ) : null}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <aside className="grid gap-3 lg:sticky lg:top-6">
          <TikTokPostPreview
            fluid
            viewport="mobile"
            fit="cover"
            handle={video.accountUsername}
            account={{
              id: video.accountId,
              name: video.accountName,
              avatarUrl: video.accountAvatarUrl,
              platform: 'tiktok',
            }}
            caption={video.title || video.description || ''}
            media={
              video.coverImageUrl
                ? [{ id: video.id, type: 'image', url: video.coverImageUrl, name: video.id }]
                : []
            }
            labels={{ isAigc: video.isAigc }}
            facts={{
              likes: formatCompact(video.likes, locale),
              comments: formatCompact(video.comments, locale),
              shares: formatCompact(video.shares, locale),
              bookmarks: '—',
            }}
          />
          {video.shareUrl ? (
            <Button
              icon={<IconOpen />}
              onClick={() => window.open(video.shareUrl, '_blank', 'noopener,noreferrer')}
            >
              {t('detail.openOnTikTok')}
            </Button>
          ) : null}
          <p className="text-center text-caption text-text-tertiary">
            {t('sync.lastSynced', { time: formatDateTime(data.lastSyncedAt, locale) })}
          </p>
        </aside>
        <div className="grid min-w-0 gap-6">
          <StatTiles data={data} />
          <ViewsOverTimeCard data={data} />
          <div className="grid gap-6 xl:grid-cols-2">
            <InteractionsCard data={data} />
            <InfoCard data={data} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  icon,
  note,
}: {
  label: string
  value: string
  icon: ReactNode
  note?: ReactNode
}) {
  return (
    <div className="grid content-start gap-1 rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-xs">
      <span className="flex items-center justify-between gap-2 text-body-sm text-text-secondary">
        {label}
        <span className="text-icon-sm text-text-tertiary">{icon}</span>
      </span>
      <span className="flex items-end justify-between gap-2">
        <span className="text-heading-2 font-semibold tabular-nums text-text-primary">{value}</span>
        {note}
      </span>
    </div>
  )
}

/** Against the account's average of its other recent videos; the comparison is in the tooltip. */
function AverageBadge({ value, average }: { value: number; average: number }) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  if (!average) return null
  const change = ((value - average) / average) * 100
  const percent = `${change >= 0 ? '+' : '-'}${formatNumber(Math.abs(change), locale, { maximumFractionDigits: 0 })}%`
  const hint = t('detail.stats.compared', { value: formatCompact(average, locale) })
  return (
    <Tooltip title={hint}>
      <span
        tabIndex={0}
        aria-label={`${percent}, ${hint}`}
        className={`shrink-0 cursor-default rounded-pill px-2 py-[2px] text-caption font-semibold tabular-nums focus-visible:focus-ring ${change >= 0 ? 'bg-brand-50 text-brand-700' : 'bg-accent-50 text-accent-700'}`}
      >
        {percent}
      </span>
    </Tooltip>
  )
}

function StatTiles({ data }: { data: TikTokVideoDetailDto }) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const { video, accountAverage: average } = data
  const tiles = [
    { key: 'views', icon: <IconView />, value: video.views, average: average?.views },
    { key: 'likes', icon: <IconHeart />, value: video.likes, average: average?.likes },
    { key: 'comments', icon: <IconComment />, value: video.comments, average: average?.comments },
    { key: 'shares', icon: <IconShare />, value: video.shares, average: average?.shares },
  ] as const
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
      {tiles.map((tile) => (
        <StatTile
          key={tile.key}
          label={t(`detail.stats.${tile.key}`)}
          value={formatCompact(tile.value, locale)}
          icon={tile.icon}
          note={
            tile.average !== undefined ? (
              <AverageBadge value={tile.value} average={tile.average} />
            ) : undefined
          }
        />
      ))}
      <StatTile
        label={t('detail.stats.engagementRate')}
        value={formatPercent(video.engagementRate, locale, 1)}
        icon={<IconHeart />}
      />
    </div>
  )
}

function ViewsOverTimeCard({ data }: { data: TikTokVideoDetailDto }) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  return (
    <DashboardCard
      title={t('detail.viewsOverTime.title')}
      description={t('detail.viewsOverTime.description')}
    >
      {data.series.length < 2 ? (
        <p className="text-body-sm text-text-tertiary">{t('detail.viewsOverTime.empty')}</p>
      ) : (
        <LineChart
          data={data.series.map((point) => ({
            label: formatDayMonth(point.date),
            daily: point.views,
            total: point.totalViews,
          }))}
          xAxisKey="label"
          ariaLabel={t('detail.viewsOverTime.title')}
          valueFormatter={(value) => formatNumber(value, locale)}
          series={[
            { dataKey: 'daily', label: t('detail.viewsOverTime.daily'), tone: 'primary' },
            {
              dataKey: 'total',
              label: t('detail.viewsOverTime.total'),
              tone: 'neutral',
              dashed: true,
            },
          ]}
        />
      )}
    </DashboardCard>
  )
}

const PARTS = [
  { key: 'likes', tone: 'primary' },
  { key: 'comments', tone: 'primarySoft' },
  { key: 'shares', tone: 'accent' },
] as const satisfies ReadonlyArray<{ key: string; tone: ChartTone }>

function InteractionsCard({ data }: { data: TikTokVideoDetailDto }) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const { video } = data
  return (
    <DashboardCard
      title={t('detail.interactions.title')}
      description={t('detail.interactions.description')}
    >
      <DonutChart
        ariaLabel={t('detail.interactions.title')}
        data={PARTS.map((part) => ({
          key: part.key,
          label: t(`detail.stats.${part.key}`),
          value: video[part.key],
          tone: part.tone,
        }))}
        valueFormatter={(value, percent) =>
          `${formatNumber(value, locale)} · ${formatNumber(Math.round(percent), locale)}%`
        }
        center={
          <>
            <span className="text-heading-1 tabular-nums text-text-primary">
              {formatCompact(video.engagements, locale)}
            </span>
            <span className="text-caption text-text-tertiary">
              {t('dashboard.interactions.total')}
            </span>
          </>
        }
      />
    </DashboardCard>
  )
}

function InfoCard({ data }: { data: TikTokVideoDetailDto }) {
  const { t, i18n } = useTranslation('tiktok')
  const locale = i18n.resolvedLanguage as AppLocale
  const { video } = data
  const rows: Array<{ key: string; value: ReactNode }> = [
    {
      key: 'account',
      value: video.accountUsername ? `@${video.accountUsername}` : video.accountName,
    },
    { key: 'caption', value: video.title || t('detail.info.none') },
    // TikTok often returns the caption as the description too; it is shown once then.
    ...(video.description && video.description !== video.title
      ? [{ key: 'description', value: video.description }]
      : []),
    { key: 'duration', value: formatVideoLength(video.duration) },
    {
      key: 'size',
      value: data.width && data.height ? `${data.width} × ${data.height}` : t('detail.info.none'),
    },
    {
      key: 'format',
      value: video.orientation
        ? t(`videos.orientation.${video.orientation}`)
        : t('detail.info.none'),
    },
    { key: 'videoId', value: <span className="break-all font-mono">{video.id}</span> },
    { key: 'firstSeen', value: formatDate(data.firstSeenAt, locale) },
    { key: 'lastSynced', value: formatDateTime(data.lastSyncedAt, locale) },
  ]
  return (
    <DashboardCard
      title={t('detail.info.title')}
      description={t('detail.postedOn', { date: formatDateTime(video.createdAt, locale) })}
    >
      {video.isAigc ? (
        <span className="w-fit rounded-pill bg-bg-surface-muted px-3 py-1 text-caption text-text-secondary">
          {t('detail.aigc')}
        </span>
      ) : null}
      <dl className="divide-y divide-border-subtle">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-2 text-body-sm"
          >
            <dt className="text-text-tertiary">{t(`detail.info.${row.key as 'account'}`)}</dt>
            <dd className="whitespace-pre-line text-text-primary">{row.value}</dd>
          </div>
        ))}
      </dl>
    </DashboardCard>
  )
}

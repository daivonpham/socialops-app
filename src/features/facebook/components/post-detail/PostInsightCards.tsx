import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCityLabel, formatCountryLabel, formatNumber, type AppLocale } from '@/shared/i18n'
import {
  IconInfo,
  IconLink,
  IconProfile,
  IconThumbsUp,
  IconView,
  LineChart,
  Progress,
  Tooltip,
} from '@/shared/ui'
import type { FacebookPostDetailDto, FacebookPostVideoDetails } from '../../api'
import { useFormatDuration } from '../../model/duration'
import { DashboardCard } from '../dashboard/DashboardCard'
import { formatDayMonth } from '../dashboard/format'

type Detail = FacebookPostDetailDto
type Post = Detail['post']

/** Reactions in the order Facebook shows them; any other key Meta adds follows. */
const REACTIONS = ['like', 'love', 'care', 'haha', 'wow', 'sorry', 'anger'] as const
const REACTION_EMOJI: Record<(typeof REACTIONS)[number], string> = {
  like: '👍',
  love: '❤️',
  care: '🥰',
  haha: '😆',
  wow: '😮',
  sorry: '😢',
  anger: '😡',
}
const KNOWN_CLICKS = ['link clicks', 'photo view', 'video play', 'other clicks'] as const
const KNOWN_SOURCES = ['page_owned', 'shared', 'crossposted', 'boosted'] as const
const GENDERS = ['F', 'M', 'U'] as const
const TOP_ROWS = 5

function useLocale(): AppLocale {
  const { i18n } = useTranslation('facebook')
  return i18n.resolvedLanguage as AppLocale
}

/** A card title with its explanation behind an info icon. */
function HintTitle({ title, hint }: { title: ReactNode; hint: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {title}
      <Tooltip title={hint}>
        <span className="inline-flex text-body-md text-text-tertiary">
          <IconInfo aria-label={hint} />
        </span>
      </Tooltip>
    </span>
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
      <span className="text-heading-2 font-semibold tabular-nums text-text-primary">{value}</span>
      {note}
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg bg-bg-surface-subtle p-4">
      <span className="text-heading-3 tabular-nums text-text-primary">{value}</span>
      <span className="text-body-sm text-text-secondary">{label}</span>
    </div>
  )
}

/** Rows of label, value and bar; bars are shares of `total`, by default the rows' own sum. */
function ShareList({
  rows,
  ariaLabel,
  total = rows.reduce((sum, row) => sum + row.value, 0),
  percentOnly = false,
}: {
  rows: Array<{ label: string; value: number }>
  ariaLabel: string
  total?: number
  /** Show the share only, for values that mean little on their own (e.g. watch time). */
  percentOnly?: boolean
}) {
  const locale = useLocale()
  return (
    <ol className="grid gap-3" aria-label={ariaLabel}>
      {rows.map((row) => {
        const percent = total ? (row.value / total) * 100 : 0
        const share = `${formatNumber(percent, locale, { maximumFractionDigits: 1 })}%`
        return (
          <li key={row.label} className="grid gap-1">
            <span className="flex items-center justify-between gap-2 text-body-sm">
              <span className="truncate text-text-primary">{row.label}</span>
              <span className="shrink-0 tabular-nums text-text-secondary">
                {percentOnly ? share : `${formatNumber(row.value, locale)} · ${share}`}
              </span>
            </span>
            <Progress percent={percent} ariaLabel={row.label} />
          </li>
        )
      })}
    </ol>
  )
}

function sortedEntries(values: Record<string, number> | undefined): Array<[string, number]> {
  return Object.entries(values ?? {})
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1])
}

/** The post's headline figures in one row; follows only when Facebook reports them. */
export function PostStatTiles({ detail }: { detail: Detail }) {
  const { t } = useTranslation('facebook')
  const locale = useLocale()
  const { post, typical } = detail
  const count = (value: number | null) => (value === null ? '—' : formatNumber(value, locale))
  const typicalViews = typical?.mediaViews ?? null
  const change =
    post.mediaViews !== null && typicalViews
      ? ((post.mediaViews - typicalViews) / typicalViews) * 100
      : null
  const tiles = [
    {
      key: 'views',
      label: t('postColumns.mediaViews'),
      value: count(post.mediaViews),
      icon: <IconView aria-hidden />,
      note:
        change === null ? undefined : (
          <Tooltip title={t('postDetail.typicalHint', { count: typical?.posts ?? 0 })}>
            <span
              className={`justify-self-start rounded-pill px-2 py-[2px] text-caption font-semibold ${change >= 0 ? 'bg-brand-50 text-brand-700' : 'bg-accent-50 text-accent-700'}`}
            >
              {t(change >= 0 ? 'postDetail.aboveTypical' : 'postDetail.belowTypical', {
                percent: `${formatNumber(Math.abs(change), locale, { maximumFractionDigits: 0 })}%`,
              })}
            </span>
          </Tooltip>
        ),
    },
    {
      key: 'viewers',
      label: t('postColumns.viewers'),
      value: count(post.viewers),
      icon: <IconProfile aria-hidden />,
    },
    {
      key: 'interactions',
      label: t('postColumns.contentInteractions'),
      value: count(post.contentInteractions),
      icon: <IconThumbsUp aria-hidden />,
    },
    {
      key: 'clicks',
      label: t('postColumns.clicks'),
      value: count(post.clicks),
      icon: <IconLink aria-hidden />,
    },
    ...(post.newFollowers === null
      ? []
      : [
          {
            key: 'follows',
            label: t('postColumns.newFollowers'),
            value: count(post.newFollowers),
            icon: <IconProfile aria-hidden />,
          },
        ]),
  ]
  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 ${tiles.length > 4 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}
    >
      {tiles.map(({ key, ...tile }) => (
        <StatTile key={key} {...tile} />
      ))}
    </div>
  )
}

/** Running views by day; shown once there are at least two days to draw. */
export function ViewsOverTimeCard({ detail }: { detail: Detail }) {
  const { t } = useTranslation('facebook')
  const locale = useLocale()
  const points = detail.daily.filter((point) => point.mediaViews !== null)
  const typicalViews = detail.typical?.mediaViews ?? null
  if (points.length < 2) return null
  return (
    <DashboardCard title={t('postDetail.viewsOverTime.title')}>
      <LineChart
        data={points.map((point) => ({
          label: formatDayMonth(point.date),
          views: point.mediaViews ?? 0,
          ...(typicalViews !== null ? { typical: typicalViews } : {}),
        }))}
        xAxisKey="label"
        ariaLabel={t('postDetail.viewsOverTime.title')}
        valueFormatter={(value) => formatNumber(value, locale)}
        series={[
          { dataKey: 'views', label: t('postDetail.viewsOverTime.thisPost'), tone: 'facebook' },
          ...(typicalViews !== null
            ? [
                {
                  dataKey: 'typical',
                  label: t('postDetail.viewsOverTime.typical'),
                  tone: 'neutral' as const,
                  dashed: true,
                },
              ]
            : []),
        ]}
      />
    </DashboardCard>
  )
}

export function InteractionsCard({ post }: { post: Post }) {
  const { t } = useTranslation('facebook')
  const locale = useLocale()
  const count = (value: number | null) => (value === null ? '—' : formatNumber(value, locale))
  const extra = Object.keys(post.reactionTypes).filter(
    (key) => !(REACTIONS as readonly string[]).includes(key),
  )
  return (
    <DashboardCard
      title={
        <HintTitle
          title={t('postDetail.interactions.titleUnknown')}
          hint={t('postDetail.interactions.hint')}
        />
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <MetricTile label={t('postDetail.interactions.reactions')} value={count(post.reactions)} />
        <MetricTile label={t('postDetail.interactions.comments')} value={count(post.comments)} />
        <MetricTile label={t('postDetail.interactions.shares')} value={count(post.shares)} />
      </div>
      <ul
        className="grid grid-cols-4 gap-3 sm:grid-cols-7"
        aria-label={t('postDetail.interactions.byType')}
      >
        {REACTIONS.map((key) => (
          <li key={key} className="grid justify-items-center gap-1 text-center">
            <span className="text-heading-3" aria-hidden>
              {REACTION_EMOJI[key]}
            </span>
            <span className="text-caption text-text-tertiary">
              {t(`postDetail.interactions.reaction.${key}`)}
            </span>
            <span className="text-label-md tabular-nums text-text-primary">
              {formatNumber(post.reactionTypes[key] ?? 0, locale)}
            </span>
          </li>
        ))}
        {extra.map((key) => (
          <li key={key} className="grid justify-items-center gap-1 text-center">
            <span className="text-caption text-text-tertiary">{key}</span>
            <span className="text-label-md tabular-nums text-text-primary">
              {formatNumber(post.reactionTypes[key] ?? 0, locale)}
            </span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  )
}

export function ClicksCard({ post }: { post: Post }) {
  const { t } = useTranslation('facebook')
  const rows = sortedEntries(post.details.clicksByType).map(([key, value]) => ({
    label: (KNOWN_CLICKS as readonly string[]).includes(key)
      ? t(`postDetail.clicks.type.${key as (typeof KNOWN_CLICKS)[number]}`)
      : key,
    value,
  }))
  return (
    <DashboardCard title={t('postDetail.clicks.title')}>
      {rows.length ? (
        <ShareList rows={rows} ariaLabel={t('postDetail.clicks.title')} />
      ) : (
        <p className="text-body-sm text-text-tertiary">{t('postDetail.clicks.empty')}</p>
      )}
    </DashboardCard>
  )
}

/** Every video figure Facebook returned for the post. */
export function VideoPerformanceCard({ post }: { post: Post }) {
  const { t } = useTranslation('facebook')
  const locale = useLocale()
  const formatDuration = useFormatDuration()
  const video: FacebookPostVideoDetails = post.details.video ?? {}
  const times: Array<[string, number | null]> = [
    ['avgTime', post.videoAvgTimeMs],
    ['viewTime', post.videoViewTimeMs],
    ['length', post.videoLengthMs],
  ]
  const counts: Array<[string, number | null | undefined]> = [
    ['views', post.videoViews],
    ['reelPlays', video.reelPlays],
    ['reelInitialPlays', video.reelInitialPlays],
    ['reelReplays', video.reelReplays],
    ['views15s', video.views15s],
    ['views60s', video.views60s],
    ['completeViews30s', video.completeViews30s],
    ['soundOnViews', video.soundOnViews],
    ['autoplayedViews', video.autoplayedViews],
    ['clickedToPlayViews', video.clickedToPlayViews],
    ['organicViews', video.organicViews],
    ['paidViews', video.paidViews],
  ]
  const tiles = [
    ...times.flatMap(([key, value]) =>
      value === null ? [] : [{ key, value: formatDuration(value) }],
    ),
    ...counts.flatMap(([key, value]) =>
      value === null || value === undefined ? [] : [{ key, value: formatNumber(value, locale) }],
    ),
  ]
  if (!tiles.length) return null
  return (
    <DashboardCard title={t('postDetail.video.title')}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((tile) => (
          <MetricTile
            key={tile.key}
            label={t(`postDetail.video.${tile.key as 'views'}`)}
            value={tile.value}
          />
        ))}
      </div>
    </DashboardCard>
  )
}

export function RetentionCard({ post }: { post: Post }) {
  const { t } = useTranslation('facebook')
  const locale = useLocale()
  const retention = (post.details.video?.retention ?? []).map((share, second) => ({
    label: t('postDetail.retention.second', { second }),
    share: Math.round(share * 1000) / 10,
  }))
  if (retention.length < 2) return null
  return (
    <DashboardCard
      title={
        <HintTitle title={t('postDetail.retention.title')} hint={t('postDetail.retention.hint')} />
      }
    >
      <LineChart
        data={retention}
        xAxisKey="label"
        ariaLabel={t('postDetail.retention.title')}
        valueFormatter={(value) => `${formatNumber(value, locale)}%`}
        series={[{ dataKey: 'share', label: t('postDetail.retention.share'), tone: 'facebook' }]}
      />
    </DashboardCard>
  )
}

export function SourcesCard({ post }: { post: Post }) {
  const { t } = useTranslation('facebook')
  const rows = sortedEntries(post.details.video?.viewsBySource).map(([key, value]) => ({
    label: (KNOWN_SOURCES as readonly string[]).includes(key)
      ? t(`postDetail.sources.type.${key as (typeof KNOWN_SOURCES)[number]}`)
      : key,
    value,
  }))
  if (!rows.length) return null
  return (
    <DashboardCard title={t('postDetail.sources.title')}>
      <ShareList rows={rows} ariaLabel={t('postDetail.sources.title')} />
    </DashboardCard>
  )
}

/**
 * Who watched, by share of watch time. Meta keys age and gender as "F.25-34", countries as
 * "Vietnam (VN)" and regions as "Hanoi - Vietnam".
 */
export function VideoAudienceCard({ post }: { post: Post }) {
  const { t } = useTranslation('facebook')
  const locale = useLocale()
  const video = post.details.video ?? {}
  const genderLabel = (code: string) =>
    (GENDERS as readonly string[]).includes(code)
      ? t(`postDetail.audience.gender.${code as (typeof GENDERS)[number]}`)
      : code
  const countryLabel = (key: string) => {
    const code = /\(([A-Z]{2})\)$/.exec(key)?.[1]
    return code ? formatCountryLabel(code, locale) : key
  }
  const groups = [
    {
      key: 'ageGender',
      rows: sortedEntries(video.viewTimeByAgeGender).map(([key, value]) => {
        const [gender = '', age = ''] = key.split('.')
        return { label: age ? `${genderLabel(gender)} · ${age}` : key, value }
      }),
    },
    {
      key: 'countries',
      rows: sortedEntries(video.viewTimeByCountry).map(([key, value]) => ({
        label: countryLabel(key),
        value,
      })),
    },
    {
      key: 'regions',
      rows: sortedEntries(video.viewTimeByRegion).map(([key, value]) => ({
        label: formatCityLabel(key.replace(/\s+-\s+/g, ', '), locale),
        value,
      })),
    },
  ] as const
  const shown = groups.filter((group) => group.rows.length)
  if (!shown.length) return null
  return (
    <DashboardCard
      title={
        <HintTitle title={t('postDetail.audience.title')} hint={t('postDetail.audience.hint')} />
      }
    >
      <div className={`grid gap-6 ${shown.length > 1 ? 'md:grid-cols-3' : ''}`}>
        {shown.map((group) => (
          <div key={group.key} className="grid content-start gap-3">
            <h3 className="text-label-md text-text-secondary">
              {t(`postDetail.audience.${group.key}`)}
            </h3>
            <ShareList
              rows={group.rows.slice(0, TOP_ROWS)}
              // Shares of all watch time, so the top rows keep their true weight.
              total={group.rows.reduce((sum, row) => sum + row.value, 0)}
              ariaLabel={t(`postDetail.audience.${group.key}`)}
              percentOnly
            />
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

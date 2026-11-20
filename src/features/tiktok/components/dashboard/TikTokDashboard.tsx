import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useApiErrorMessage } from '@/shared/hooks'
import {
  IconArrowUp,
  IconHeart,
  IconLike,
  IconMembers,
  IconProfile,
  IconThumbsUp,
  IconVideo,
  IconView,
  SectionError,
  Spin,
  StatCards,
  type StatCardItem,
} from '@/shared/ui'
import {
  useTikTokDashboard,
  type TikTokAccountDto,
  type TikTokDashboardDto,
  type TikTokQuery,
} from '../../api'
import {
  TikTokAccountPerformanceCard,
  TikTokDurationCard,
  TikTokFollowerGrowthCard,
  TikTokHighlightsCard,
  TikTokInteractionMixCard,
  TikTokPostingTimesCard,
  TikTokTopVideosCard,
  TikTokTrendCard,
} from './TikTokDashboardCards'

/** The TikTok statistics overview, laid out like Facebook's. */
export function TikTokDashboard({
  brandId,
  query,
  accounts,
  onSelectAccount,
}: {
  brandId: string
  query: TikTokQuery
  accounts: TikTokAccountDto[]
  onSelectAccount: (accountId: string) => void
}) {
  const { t } = useTranslation('tiktok')
  const errorMessage = useApiErrorMessage('tiktok')
  const dashboard = useTikTokDashboard(brandId, query)
  const compare = query.compare === 'previous'

  if (dashboard.isPending)
    return (
      <div role="status" aria-label={t('common.loading')} className="flex justify-center py-16">
        <Spin size="lg" />
      </div>
    )
  if (dashboard.isError || !dashboard.data)
    return (
      <SectionError
        title={errorMessage(dashboard.error, t('common.loadError'))}
        retryLabel={t('common.retry')}
        onRetry={() => void dashboard.refetch()}
      />
    )

  const data = dashboard.data

  return (
    <div
      className={`grid gap-4 transition-opacity duration-fast ${dashboard.isPlaceholderData ? 'opacity-60' : ''}`}
      aria-busy={dashboard.isPlaceholderData}
    >
      <StatCards items={statItems(data, compare, t)} />
      <div className="grid gap-4 xl:grid-cols-3">
        <TikTokTrendCard className="xl:col-span-2" dashboard={data} compare={compare} />
        <TikTokInteractionMixCard interactions={data.interactions} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <TikTokFollowerGrowthCard followers={data.followers} />
        <TikTokPostingTimesCard postingTimes={data.postingTimes} />
      </div>
      {query.accountId === 'all' && data.accounts.length > 1 ? (
        <TikTokAccountPerformanceCard
          rows={data.accounts}
          accounts={accounts}
          compare={compare}
          onSelectAccount={onSelectAccount}
        />
      ) : null}
      <div className="grid gap-4 xl:grid-cols-3">
        <TikTokTopVideosCard className="xl:col-span-2" topVideos={data.topVideos} />
        <div className="grid content-start gap-4">
          <TikTokDurationCard durations={data.durations} />
          <TikTokHighlightsCard dashboard={data} compare={compare} />
        </div>
      </div>
    </div>
  )
}

function statItems(
  data: TikTokDashboardDto,
  compare: boolean,
  t: TFunction<'tiktok'>,
): StatCardItem[] {
  const { kpis } = data
  const item = (
    key: keyof TikTokDashboardDto['kpis'],
    icon: StatCardItem['icon'],
    extra: Partial<StatCardItem> = {},
  ): StatCardItem => ({
    key,
    label: t(`metrics.${key}`),
    value: kpis[key].value,
    // With comparison off there is no previous period, so no change is shown at all.
    ...(compare ? { change: kpis[key].change } : {}),
    icon,
    ...extra,
  })
  return [
    item('views', <IconView aria-hidden />, { hint: t('hints.views') }),
    item('engagements', <IconLike aria-hidden />),
    item('followers', <IconMembers aria-hidden />),
    item('netFollowers', <IconArrowUp aria-hidden />, { hint: t('hints.netFollowers') }),
    item('videos', <IconVideo aria-hidden />),
    item('totalLikes', <IconThumbsUp aria-hidden />, { hint: t('hints.totalLikes') }),
    item('following', <IconProfile aria-hidden />),
    item('engagementRate', <IconHeart aria-hidden />, {
      unit: 'percent',
      hint: t('hints.engagementRate'),
    }),
  ]
}

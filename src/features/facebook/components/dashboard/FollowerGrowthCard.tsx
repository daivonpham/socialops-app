import { useTranslation } from 'react-i18next'
import type { AppLocale } from '@/shared/i18n'
import { DivergingBarChart } from '@/shared/ui'
import type { FacebookDashboardDto } from '../../api'
import { DashboardCard } from './DashboardCard'
import { formatCompact, formatDayMonth, formatSigned } from './format'

export function FollowerGrowthCard({
  followers,
  className,
}: {
  followers: FacebookDashboardDto['followers']
  className?: string
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const range =
    followers.labels.length > 0
      ? `${formatDayMonth(followers.labels[0]!)} – ${formatDayMonth(followers.labels.at(-1)!)}`
      : ''
  const tiles = [
    {
      key: 'follows',
      value: formatSigned(followers.totalFollows, locale),
      className: 'bg-brand-50 text-brand-700',
    },
    {
      key: 'unfollows',
      value: formatSigned(-followers.totalUnfollows, locale),
      className: 'bg-accent-50 text-accent-700',
    },
    {
      key: 'net',
      value: formatSigned(followers.net, locale),
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
        data={followers.labels.map((label, index) => ({
          label,
          positive: followers.follows[index] ?? 0,
          negative: followers.unfollows[index] ?? 0,
        }))}
        positiveLabel={t('dashboard.followers.follows')}
        negativeLabel={t('dashboard.followers.unfollows')}
        valueFormatter={(value) => formatCompact(value, locale)}
        labelFormatter={formatDayMonth}
      />
    </DashboardCard>
  )
}

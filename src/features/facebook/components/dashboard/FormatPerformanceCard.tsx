import { useTranslation } from 'react-i18next'
import type { AppLocale } from '@/shared/i18n'
import { Progress } from '@/shared/ui'
import type { FacebookDashboardDto } from '../../api'
import { DashboardCard } from './DashboardCard'
import { formatCompact, formatPercent } from './format'

export function FormatPerformanceCard({
  formats,
  stories = 0,
  className,
}: {
  formats: FacebookDashboardDto['formats']
  /** Stories of the period; listed with their count only. */
  stories?: number
  className?: string
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const sorted = [...formats].sort((left, right) => right.engagementRate - left.engagementRate)
  const maxRate = sorted[0]?.engagementRate ?? 0
  const posts = formats.reduce((sum, item) => sum + item.posts, 0) + stories

  return (
    <DashboardCard
      className={className}
      title={t('dashboard.formats.title')}
      hint={t('dashboard.engagementRateFormula')}
      description={t('dashboard.formats.description', { count: posts })}
    >
      {sorted.length || stories ? (
        <ul className="grid gap-4">
          {sorted.map((item, index) => (
            <li key={item.format} className="grid gap-2">
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-body-sm">
                  <strong className="font-semibold text-text-primary">
                    {t(`dashboard.formats.names.${item.format}`)}
                  </strong>{' '}
                  <span className="text-caption text-text-tertiary">
                    {t('dashboard.formats.summary', {
                      count: item.posts,
                      value: formatCompact(item.averageViewers, locale),
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
                ariaLabel={t(`dashboard.formats.names.${item.format}`)}
              />
            </li>
          ))}
          {stories ? (
            <li className="grid gap-2">
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-body-sm">
                  <strong className="font-semibold text-text-primary">
                    {t('dashboard.formats.names.story')}
                  </strong>{' '}
                  <span className="text-caption text-text-tertiary">
                    {t('dashboard.formats.storySummary', { count: stories })}
                  </span>
                </span>
                <span className="shrink-0 text-label-md tabular-nums text-text-tertiary">—</span>
              </span>
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="text-body-sm text-text-tertiary">{t('dashboard.formats.empty')}</p>
      )}
    </DashboardCard>
  )
}

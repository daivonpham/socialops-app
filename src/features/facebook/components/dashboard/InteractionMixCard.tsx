import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import { CHART_TONE_CLASS, DonutChart, type ChartTone } from '@/shared/ui'
import type { FacebookDashboardDto } from '../../api'
import { DashboardCard } from './DashboardCard'
import { formatCompact } from './format'

const PARTS = [
  { key: 'reactions', tone: 'primary' },
  { key: 'comments', tone: 'primarySoft' },
  { key: 'shares', tone: 'accent' },
  { key: 'linkClicks', tone: 'info' },
] as const satisfies ReadonlyArray<{ key: string; tone: ChartTone }>

const REACTION_TONES: Record<string, ChartTone> = {
  like: 'primary',
  love: 'primarySoft',
  care: 'primaryFaint',
  haha: 'warning',
  wow: 'info',
  sorry: 'neutral',
  anger: 'accent',
}

export function InteractionMixCard({
  interactions,
  className,
}: {
  interactions: FacebookDashboardDto['interactions']
  className?: string
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const total = PARTS.reduce((sum, part) => sum + interactions[part.key], 0)
  const reactionTotal = interactions.reactionTypes.reduce((sum, item) => sum + item.value, 0)
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
      <ul className="grid grid-cols-2 gap-2">
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
      {interactions.reactionTypes.length ? (
        <div className="grid gap-3">
          <div className="flex items-center justify-between text-caption">
            <span className="font-medium text-text-secondary">
              {t('dashboard.interactions.reactionDetail')}
            </span>
            <span className="text-text-tertiary">
              {t('dashboard.interactions.reactionTotal', {
                value: formatCompact(reactionTotal, locale),
              })}
            </span>
          </div>
          <div aria-hidden className="flex h-2 overflow-hidden rounded-pill bg-bg-surface-muted">
            {interactions.reactionTypes.map((item) => (
              <span
                key={item.type}
                className={CHART_TONE_CLASS[REACTION_TONES[item.type] ?? 'neutralSoft']}
                style={{ width: `${(item.value / reactionTotal) * 100}%` }}
              />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
            {interactions.reactionTypes.map((item) => (
              <li key={item.type} className="flex items-center justify-between gap-2 text-caption">
                <span className="flex items-center gap-2 text-text-secondary">
                  <span
                    aria-hidden
                    className={`size-2 rounded-full ${CHART_TONE_CLASS[REACTION_TONES[item.type] ?? 'neutralSoft']}`}
                  />
                  {t(`dashboard.interactions.reactionTypes.${item.type}`, {
                    defaultValue: item.type,
                  })}
                </span>
                <span className="tabular-nums text-text-primary">
                  {formatNumber(item.value, locale)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DashboardCard>
  )
}

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AppLocale } from '@/shared/i18n'
import { Button, IconTrendingUp } from '@/shared/ui'
import type { FacebookDashboardDto } from '../../api'
import {
  WEEKDAY_KEYS,
  formatCompact,
  formatDayMonth,
  formatNumberText,
  formatPercent,
  formatSlot,
} from './format'

/** A few rule-based takeaways from the period, and a shortcut to build a report from it. */
export function HighlightsCard({
  dashboard,
  compare,
  className = '',
}: {
  dashboard: FacebookDashboardDto
  compare: boolean
  className?: string
}) {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  const navigate = useNavigate()
  const items: Array<{ key: string; label: string; value: string; detail: string }> = []

  const viewers = dashboard.kpis.viewers
  const series = dashboard.trend.viewers.current
  const peak = series.reduce(
    (best, value, index) => (value > (series[best] ?? 0) ? index : best),
    0,
  )
  if (viewers.value > 0) {
    const change = formatNumberText(Math.abs(viewers.change), locale)
    items.push({
      key: 'viewers',
      label: t('dashboard.highlights.viewersChange'),
      value: !compare
        ? formatCompact(viewers.value, locale)
        : viewers.change > 0
          ? t('dashboard.highlights.viewersUp', { value: `${change}%` })
          : viewers.change < 0
            ? t('dashboard.highlights.viewersDown', { value: `${change}%` })
            : t('dashboard.highlights.viewersFlat'),
      detail: t('dashboard.highlights.viewersDetail', {
        value: formatCompact(viewers.value, locale),
        day: formatDayMonth(dashboard.trend.labels[peak] ?? ''),
      }),
    })
  }

  const formats = [...dashboard.formats].sort(
    (left, right) => right.engagementRate - left.engagementRate,
  )
  const [bestFormat, nextFormat] = formats
  if (bestFormat && bestFormat.engagementRate > 0) {
    const name = t(`dashboard.formats.names.${bestFormat.format}`)
    const other =
      formats.find((item) => item.format === 'photo' && item !== bestFormat) ?? nextFormat
    items.push({
      key: 'format',
      label: t('dashboard.highlights.bestFormat'),
      value: t('dashboard.highlights.bestFormatValue', {
        format: name,
        rate: formatPercent(bestFormat.engagementRate, locale, 1),
      }),
      detail:
        other && other.engagementRate > 0
          ? t('dashboard.highlights.bestFormatDetail', {
              times: formatNumberText(bestFormat.engagementRate / other.engagementRate, locale),
              other: t(`dashboard.formats.names.${other.format}`).toLowerCase(),
              format: name,
            })
          : t('dashboard.highlights.bestFormatOnly'),
    })
  }

  const best = dashboard.postingTimes.best
  if (best) {
    const slot = formatSlot(best.slot)
    items.push({
      key: 'time',
      label: t('dashboard.highlights.bestTime'),
      value: `${t(`dashboard.postingTimes.longDays.${WEEKDAY_KEYS[best.day] ?? 'mon'}`)} ${slot.from}–${slot.to}`,
      detail: t('dashboard.highlights.bestTimeDetail'),
    })
  }

  const topPost = dashboard.topPosts.viewers[0]
  if (topPost) {
    items.push({
      key: 'post',
      label: t('dashboard.highlights.topPost'),
      value: topPost.message || t('dashboard.topPosts.noMessage'),
      detail: t('dashboard.highlights.topPostDetail', {
        viewers: formatCompact(topPost.viewers, locale),
        rate: formatPercent(topPost.engagementRate, locale, 1),
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
      <Button
        variant="primary"
        className="mt-auto w-full"
        onClick={() => navigate('/reports/new?template=period_overview')}
      >
        {t('dashboard.highlights.addToReport')}
      </Button>
    </section>
  )
}

import { useTranslation } from 'react-i18next'
import type { AppLocale } from '@/shared/i18n'
import { IconClock, Tooltip } from '@/shared/ui'
import type { FacebookDashboardDto } from '../../api'
import { DashboardCard } from './DashboardCard'
import { WEEKDAY_KEYS as DAYS, formatPercent, formatSlot } from './format'

const SLOTS = Array.from({ length: 12 }, (_, slot) => slot)
/** Five intensity steps, faint to strong primary green; the first also fills empty slots. */
const LEVELS = ['bg-brand-50', 'bg-brand-100', 'bg-brand-300', 'bg-brand-500', 'bg-brand-700']

export function PostingTimesCard({
  postingTimes,
  className,
}: {
  postingTimes: FacebookDashboardDto['postingTimes']
  className?: string
}) {
  const { t, i18n } = useTranslation('facebook')
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
                    className={`block h-10 rounded-lg ${cell ? level(cell.engagementRate) : LEVELS[0]} ${isBest ? 'ring-2 ring-action-primary ring-offset-2' : cell?.posts === 1 ? 'opacity-50' : ''}`}
                  />
                )
                return cell ? (
                  <Tooltip
                    key={slot}
                    title={t('dashboard.postingTimes.cell', {
                      day: t(`dashboard.postingTimes.longDays.${dayKey}`),
                      ...formatSlot(slot),
                      posts: cell.posts,
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

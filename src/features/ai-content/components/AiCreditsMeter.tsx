import { useTranslation } from 'react-i18next'
import { formatDate, formatNumber, type AppLocale } from '@/shared/i18n'
import { Tooltip } from '@/shared/ui'
import type { AiAvailability } from '../api'
import { AiMark } from './AiMark'

type Credits = Pick<AiAvailability, 'creditsRemaining' | 'creditsTotal' | 'creditsResetAt'>

/** At or below this share of the month's Credits, the meter warns. */
const LOW_SHARE = 0.1

function useCredits({ creditsRemaining, creditsTotal, creditsResetAt }: Credits) {
  const { t, i18n } = useTranslation('aiContent')
  const locale = i18n.language as AppLocale
  const share =
    creditsRemaining === null || !creditsTotal
      ? null
      : Math.min(1, Math.max(0, creditsRemaining / creditsTotal))
  return {
    t,
    share,
    low: share !== null && share <= LOW_SHARE,
    renews: t('credits.empty.renews', { date: formatDate(creditsResetAt, i18n.language) }),
    amount: (value: number, compact = false) =>
      formatNumber(
        value,
        locale,
        compact ? { notation: 'compact', maximumSignificantDigits: 3 } : undefined,
      ),
  }
}

/** The person's own Credits at the foot of the column, with how much of the month's is left. */
export function AiCreditsMeter(credits: Credits) {
  const { t, share, low, renews, amount } = useCredits(credits)
  const { creditsRemaining: remaining, creditsTotal: total } = credits
  return (
    <section
      aria-label={t('credits.title')}
      className="grid gap-2 rounded-xl border border-ai-200 bg-bg-surface/80 p-3 shadow-xs"
    >
      <div className="flex items-center gap-2">
        <AiMark className="w-[16px]" />
        <span className="min-w-0 flex-1 truncate text-label-sm text-text-secondary">
          {t('credits.title')}
        </span>
        {remaining === null ? (
          <span className="text-label-sm text-ai-700">{t('credits.unlimited')}</span>
        ) : (
          <span className="text-body-sm text-text-tertiary tabular-nums">
            <strong className={'text-label-md ' + (low ? 'text-warning-700' : 'text-text-primary')}>
              {amount(remaining)}
            </strong>
            {total === null ? null : ` / ${amount(total)}`}
          </span>
        )}
      </div>
      {share === null ? null : (
        <div
          role="progressbar"
          aria-label={t('credits.title')}
          aria-valuemin={0}
          aria-valuemax={total ?? undefined}
          aria-valuenow={remaining ?? undefined}
          className="h-[6px] overflow-hidden rounded-full bg-ai-100"
        >
          <div
            className={
              'h-full rounded-full transition-[width] duration-fast ' +
              (low ? 'bg-warning-500' : 'bg-linear-to-r from-ai-400 to-ai-600')
            }
            style={{ width: `${share * 100}%` }}
          />
        </div>
      )}
      {remaining === null ? null : <p className="text-caption text-text-tertiary">{renews}</p>}
    </section>
  )
}

/** The same number on the collapsed column, with the full sentence on hover. */
export function AiCreditsRail(credits: Credits) {
  const { t, low, renews, amount } = useCredits(credits)
  const remaining = credits.creditsRemaining
  const label =
    remaining === null
      ? `${t('credits.title')}: ${t('credits.unlimited')}`
      : `${t('credits.title')}: ${amount(remaining)}. ${renews}`
  return (
    <Tooltip title={label} placement="right">
      <span
        role="img"
        tabIndex={0}
        aria-label={label}
        className={
          'flex size-[40px] items-center justify-center rounded-lg bg-bg-surface text-label-sm tabular-nums shadow-xs focus-visible:focus-ring ' +
          (low ? 'text-warning-700' : 'text-ai-700')
        }
      >
        {remaining === null ? '∞' : amount(remaining, true)}
      </span>
    </Tooltip>
  )
}

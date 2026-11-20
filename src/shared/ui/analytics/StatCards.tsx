import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'
import { IconArrowDown, IconArrowUp, IconInfo, Tooltip } from '../primitives'

export type StatCardItem = {
  key: string
  label: string
  value: number
  /** Percent against the previous period; null when there is nothing to compare, undefined to hide. */
  change?: number | null
  unit?: 'count' | 'percent'
  icon: ReactNode
  /** How the figure is worked out, behind an info icon next to its name. */
  hint?: string
  /** A small dotted note after the name (e.g. "Estimated"), explained on hover. */
  note?: { label: string; hint?: string }
}

/** The row of headline figures on a platform's statistics screen. */
export function StatCards({ items }: { items: StatCardItem[] }) {
  const { t, i18n } = useTranslation('common')
  const locale = i18n.resolvedLanguage as AppLocale

  return (
    // Two to a row even on a phone: the icon goes and the change sits under the number there.
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {items.map((item) => {
        // Null: the previous period had none, so there is no change to show.
        const positive = item.change == null || item.change >= 0
        return (
          <div
            key={item.key}
            className="relative flex min-w-0 items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface p-3 shadow-xs sm:p-4"
          >
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface-subtle text-icon-sm text-text-secondary shadow-xs sm:flex">
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="text-label-sm leading-snug text-text-tertiary">{item.label}</span>
                {item.hint ? (
                  <Tooltip title={item.hint}>
                    <span className="inline-flex text-caption text-text-tertiary">
                      <IconInfo aria-label={item.hint} />
                    </span>
                  </Tooltip>
                ) : null}
                {item.note ? (
                  <Tooltip title={item.note.hint}>
                    <span
                      className={`text-caption text-text-disabled ${item.note.hint ? 'cursor-help underline decoration-dotted' : ''}`}
                    >
                      {item.note.label}
                    </span>
                  </Tooltip>
                ) : null}
              </div>
              <strong className="block truncate text-heading-2 tabular-nums text-text-primary sm:text-heading-1">
                {item.unit === 'percent'
                  ? t('analytics.percentage', {
                      value: formatNumber(item.value, locale, { maximumFractionDigits: 1 }),
                    })
                  : formatNumber(item.value, locale, {
                      notation: item.value > 9999 ? 'compact' : 'standard',
                      maximumFractionDigits: 1,
                    })}
              </strong>
              {item.change === undefined ? null : item.change === null ? (
                <span className="text-label-sm text-text-tertiary sm:absolute sm:bottom-4 sm:right-4">
                  —
                </span>
              ) : (
                <span
                  className={
                    'flex shrink-0 items-center gap-1 text-label-sm sm:absolute sm:bottom-4 sm:right-4 ' +
                    (positive ? 'text-success-700' : 'text-error-700')
                  }
                >
                  {positive ? <IconArrowUp /> : <IconArrowDown />}
                  <span className="tabular-nums">{Math.abs(item.change)}%</span>
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

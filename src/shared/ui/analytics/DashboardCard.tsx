import type { ReactNode } from 'react'
import { IconInfo, Tooltip } from '../primitives'

/** White dashboard panel: title (with an optional info tip) and description on the left, controls on the right. */
export function DashboardCard({
  title,
  description,
  hint,
  extra,
  children,
  className = '',
}: {
  title: ReactNode
  description?: ReactNode
  hint?: string
  extra?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`flex min-w-0 flex-col gap-5 rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-xs sm:p-5 ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-heading-3 text-text-primary">{title}</h2>
            {hint ? (
              <Tooltip title={hint}>
                <span className="inline-flex text-body-sm text-text-tertiary">
                  <IconInfo aria-label={hint} />
                </span>
              </Tooltip>
            ) : null}
          </div>
          {description ? <p className="text-body-sm text-text-tertiary">{description}</p> : null}
        </div>
        {extra}
      </header>
      {children}
    </section>
  )
}

/** Up/down pill for a percentage change against the previous period; "—" with nothing to compare. */
export function ChangePill({ change, locale }: { change: number | null; locale: string }) {
  if (change === null)
    return (
      <span className="inline-flex shrink-0 items-center rounded-pill bg-bg-surface-muted px-2 py-[2px] text-caption font-semibold text-text-tertiary">
        —
      </span>
    )
  const tone =
    change > 0
      ? 'bg-brand-50 text-brand-700'
      : change < 0
        ? 'bg-accent-50 text-accent-700'
        : 'bg-bg-surface-muted text-text-tertiary'
  const text = `${change > 0 ? '↑ +' : change < 0 ? '↓ ' : ''}${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(change)}%`
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-pill px-2 py-[2px] text-caption font-semibold tabular-nums ${tone}`}
    >
      {text}
    </span>
  )
}

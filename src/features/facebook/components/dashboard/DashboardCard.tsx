import type { ReactNode } from 'react'

/** White dashboard panel: title and description on the left, controls on the right. */
export function DashboardCard({
  title,
  description,
  extra,
  children,
  className = '',
}: {
  title: ReactNode
  description?: ReactNode
  extra?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`flex min-w-0 flex-col gap-5 rounded-xl border border-border-subtle bg-bg-surface p-5 shadow-xs ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h2 className="text-heading-3 text-text-primary">{title}</h2>
          {description ? <p className="text-body-sm text-text-tertiary">{description}</p> : null}
        </div>
        {extra}
      </header>
      {children}
    </section>
  )
}

/** Up/down pill for a percentage change against the previous period. */
export function ChangePill({ change, locale }: { change: number; locale: string }) {
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

const unit = (locale: string, name: 'hour' | 'minute' | 'second', value: number) =>
  new Intl.NumberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'narrow' }).format(value)

/**
 * How long the AI worked on a turn, "2m 22s" or "2 phút 22 giây": zero parts are left out, and
 * anything under a second reads as one. `null` when either time is missing or out of order.
 */
export function turnDuration(
  createdAt: string,
  finishedAt: string | null,
  locale: string,
): string | null {
  if (!finishedAt) return null
  const ms = Date.parse(finishedAt) - Date.parse(createdAt)
  if (!Number.isFinite(ms) || ms < 0) return null
  const total = Math.max(1, Math.round(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return [
    hours ? unit(locale, 'hour', hours) : null,
    minutes ? unit(locale, 'minute', minutes) : null,
    seconds ? unit(locale, 'second', seconds) : null,
  ]
    .filter(Boolean)
    .join(' ')
}

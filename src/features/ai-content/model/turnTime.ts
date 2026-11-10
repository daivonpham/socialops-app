import { formatDateTime } from '@/shared/i18n'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** How long ago a turn was made: `null` under a minute, for the caller's "just now" wording. */
export function turnTimeAgo(createdAt: string, now: number, locale: string): string | null {
  const age = now - new Date(createdAt).getTime()
  if (age < MINUTE) return null
  if (age >= DAY) return formatDateTime(createdAt, locale)
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })
  return age < HOUR
    ? relative.format(-Math.floor(age / MINUTE), 'minute')
    : relative.format(-Math.floor(age / HOUR), 'hour')
}

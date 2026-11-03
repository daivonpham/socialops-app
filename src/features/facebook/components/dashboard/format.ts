import { formatNumber, type AppLocale } from '@/shared/i18n'

/** Full number below 10,000 ("2.403"), then K/M with one decimal ("18,5K", "1,2M"). */
export function formatCompact(value: number, locale: AppLocale): string {
  const abs = Math.abs(value)
  const scaled = (divisor: number, suffix: string) =>
    `${formatNumber(value / divisor, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${suffix}`
  if (abs >= 1_000_000) return scaled(1_000_000, 'M')
  if (abs >= 10_000) return scaled(1_000, 'K')
  return formatNumber(Math.round(value), locale)
}

export function formatSigned(value: number, locale: AppLocale): string {
  const text = formatCompact(value, locale)
  return value > 0 ? `+${text}` : text
}

/** `value` is already a percentage (5.65 → "5,65%"). */
export function formatPercent(value: number, locale: AppLocale, digits = 2): string {
  return `${formatNumber(value, locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
}

/** "2026-10-09" → "09/10". */
export function formatDayMonth(day: string): string {
  const [, month, date] = day.split('-')
  return month && date ? `${date}/${month}` : day
}

export function formatSlot(slot: number): { from: string; to: string } {
  const hour = (value: number) => `${String(value % 24).padStart(2, '0')}h`
  return { from: hour(slot * 2), to: hour(slot * 2 + 2) }
}

export function formatNumberText(value: number, locale: AppLocale, digits = 1): string {
  return formatNumber(value, locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** API weekday index (0 = Monday) to its translation key. */
export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

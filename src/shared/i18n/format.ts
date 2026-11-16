import { resolveLocale, type AppLocale } from './locales'

type DateInput = Date | number | string
type DateTimeParts = Record<Intl.DateTimeFormatPartTypes, string>

const CUSTOM_DATE_FORMATTERS = new Map<string, Intl.DateTimeFormat>()

const DATE_PATTERNS: Record<AppLocale, string> = {
  'en-US': 'MM/DD/YYYY',
  'vi-VN': 'DD/MM/YYYY',
}

const TIME_PATTERNS: Record<AppLocale, string> = {
  'en-US': 'h:mm A',
  'vi-VN': 'HH:mm',
}

const DATE_FORMATTERS: Record<AppLocale, Intl.DateTimeFormat> = {
  'en-US': new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }),
  'vi-VN': new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }),
}

const TIME_FORMATTERS: Record<AppLocale, Intl.DateTimeFormat> = {
  'en-US': new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }),
  'vi-VN': new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }),
}

function toDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toParts(formatter: Intl.DateTimeFormat, date: Date): DateTimeParts {
  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  ) as DateTimeParts
}

export function formatLocalizedDate(
  value: DateInput,
  locale: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(value)
  if (!date) return ''

  const resolvedLocale = resolveLocale(locale)
  const cacheKey = `${resolvedLocale}:${JSON.stringify(options)}`
  let formatter = CUSTOM_DATE_FORMATTERS.get(cacheKey)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(resolvedLocale, options)
    CUSTOM_DATE_FORMATTERS.set(cacheKey, formatter)
  }
  return formatter.format(date)
}

export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function getDatePickerFormat(locale?: string | null, includeTime = false): string {
  const resolvedLocale = resolveLocale(locale)
  if (!includeTime) return DATE_PATTERNS[resolvedLocale]
  return `${TIME_PATTERNS[resolvedLocale]} ${DATE_PATTERNS[resolvedLocale]}`
}

export function uses12HourTime(locale?: string | null): boolean {
  return resolveLocale(locale) === 'en-US'
}

export function formatDate(value: DateInput, locale?: string | null, timeZone?: string): string {
  const date = toDate(value)
  if (!date) return ''

  const resolvedLocale = resolveLocale(locale)
  const formatter = timeZone
    ? new Intl.DateTimeFormat(resolvedLocale, {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : DATE_FORMATTERS[resolvedLocale]
  const { day, month, year } = toParts(formatter, date)
  return resolvedLocale === 'vi-VN' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`
}

export function formatTime(value: DateInput, locale?: string | null, timeZone?: string): string {
  const date = toDate(value)
  if (!date) return ''

  const resolvedLocale = resolveLocale(locale)
  const formatter = timeZone
    ? new Intl.DateTimeFormat(resolvedLocale, {
        timeZone,
        hour: resolvedLocale === 'vi-VN' ? '2-digit' : 'numeric',
        minute: '2-digit',
        hour12: resolvedLocale !== 'vi-VN',
      })
    : TIME_FORMATTERS[resolvedLocale]
  const { hour, minute, dayPeriod } = toParts(formatter, date)
  return resolvedLocale === 'vi-VN' ? `${hour}:${minute}` : `${hour}:${minute} ${dayPeriod}`
}

export function formatDateTime(
  value: DateInput,
  locale?: string | null,
  timeZone?: string,
): string {
  const date = toDate(value)
  if (!date) return ''
  return `${formatTime(date, locale, timeZone)} ${formatDate(date, locale, timeZone)}`
}

export function formatNumber(
  value: number,
  locale: AppLocale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber, type AppLocale } from '@/shared/i18n'

export type DurationUnits = {
  seconds: (value: string) => string
  minutes: (minutes: string, seconds: string) => string
  hours: (hours: string, minutes: string) => string
}

/** Milliseconds as "12,2 giây", "3 phút 05 giây" or "2 giờ 10 phút". */
export function formatDuration(ms: number, locale: AppLocale, units: DurationUnits): string {
  const totalSeconds = ms / 1000
  if (totalSeconds < 60)
    return units.seconds(formatNumber(totalSeconds, locale, { maximumFractionDigits: 1 }))
  const seconds = Math.round(totalSeconds)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours) return units.hours(formatNumber(hours, locale), String(minutes).padStart(2, '0'))
  return units.minutes(String(minutes), String(seconds % 60).padStart(2, '0'))
}

/** formatDuration in the current language. */
export function useFormatDuration(): (ms: number) => string {
  const { t, i18n } = useTranslation('facebook')
  const locale = i18n.resolvedLanguage as AppLocale
  return useCallback(
    (ms: number) =>
      formatDuration(ms, locale, {
        seconds: (value) => t('duration.seconds', { value }),
        minutes: (minutes, seconds) => t('duration.minutes', { minutes, seconds }),
        hours: (hours, minutes) => t('duration.hours', { hours, minutes }),
      }),
    [locale, t],
  )
}

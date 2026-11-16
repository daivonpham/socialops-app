import type { ReportConfig } from '../api/types'

type Period = ReportConfig['period']
type Range = [string, string]

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}
function shift(key: string, days: number): string {
  return dateKey(new Date(Date.parse(key) + days * 86_400_000))
}

export function periodDates(period: Period): Range {
  if (period.preset === 'custom') return [period.since, period.until]
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  const today = `${part('year')}-${part('month')}-${part('day')}`
  if (period.preset === 'this_month') return [`${today.slice(0, 7)}-01`, today]
  if (period.preset === 'last_month') {
    const firstThisMonth = `${today.slice(0, 7)}-01`
    const lastPreviousMonth = shift(firstThisMonth, -1)
    return [`${lastPreviousMonth.slice(0, 7)}-01`, lastPreviousMonth]
  }
  // "Last N days" are the N whole days before today, as Facebook counts them: today is not over.
  const yesterday = shift(today, -1)
  return [shift(yesterday, 1 - Number(period.preset.slice(0, -1))), yesterday]
}

export function reportDatePresets(
  t: (
    key:
      | 'presets.7d'
      | 'presets.14d'
      | 'presets.30d'
      | 'presets.90d'
      | 'presets.this_month'
      | 'presets.last_month',
  ) => string,
): Array<{ label: string; value: Range }> {
  const days = [7, 14, 30, 90] as const
  const until = periodDates({ preset: '7d' })[1]
  return [
    ...days.map((count) => ({
      label: t(`presets.${count}d`),
      value: [shift(until, 1 - count), until] as Range,
    })),
    { label: t('presets.this_month'), value: periodDates({ preset: 'this_month' }) },
    { label: t('presets.last_month'), value: periodDates({ preset: 'last_month' }) },
  ]
}

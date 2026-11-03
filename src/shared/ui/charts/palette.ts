import { color, semanticColor } from '@/shared/styles/tokens'

/** Series colors for dashboard charts; green follows the product primary. */
export const CHART_TONE = {
  primary: semanticColor.action.primary,
  primarySoft: color.brand[300],
  primaryFaint: color.brand[100],
  accent: color.accent[500],
  accentSoft: color.accent[300],
  info: color.info[500],
  warning: color.warning[500],
  neutral: color.neutral[400],
  neutralSoft: color.neutral[300],
} as const

export type ChartTone = keyof typeof CHART_TONE

/** Tailwind background for each tone, for legends and bars drawn with plain elements. */
export const CHART_TONE_CLASS: Record<ChartTone, string> = {
  primary: 'bg-action-primary',
  primarySoft: 'bg-brand-300',
  primaryFaint: 'bg-brand-100',
  accent: 'bg-accent-500',
  accentSoft: 'bg-accent-300',
  info: 'bg-info-500',
  warning: 'bg-warning-500',
  neutral: 'bg-neutral-400',
  neutralSoft: 'bg-neutral-300',
}

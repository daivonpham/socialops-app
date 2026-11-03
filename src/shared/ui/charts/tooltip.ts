import { radius, semanticColor, shadow } from '@/shared/styles/tokens'

/** One look for every Recharts tooltip in the app. */
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: semanticColor.bg.elevated,
    border: `1px solid ${semanticColor.border.DEFAULT}`,
    borderRadius: radius.lg,
    boxShadow: shadow.md,
  },
  labelStyle: { color: semanticColor.text.primary },
  itemStyle: { color: semanticColor.text.secondary },
} as const

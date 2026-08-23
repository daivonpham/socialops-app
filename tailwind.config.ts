import type { Config } from 'tailwindcss'
import {
  breakpoint,
  color,
  componentToken,
  layout,
  motion,
  radius,
  semanticColor,
  shadow,
  space,
  typography,
  zIndex,
} from './src/shared/styles/tokens'

// Tailwind consumer of the token file (wired via `@config` in shared/styles/index.css).
// The theme is fully REPLACED (not extended) so only design.md-derived values exist
// as utilities — `bg-red-500` or `p-7` simply do not compile to anything.

const px = (value: number | string) => (typeof value === 'number' ? `${value}px` : value)
const ms = (value: number) => `${value}ms`
const pxScale = (values: Record<string, number | string>) =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, px(value)]))

// Each type step carries its own line-height, weight AND letter spacing
// (design.md §5.4: headings -0.01em, body 0) so `text-heading-1` is complete on
// its own and the tracking can never be forgotten. Uppercase labels still opt
// into `tracking-caps` explicitly, since that rule depends on casing, not size.
const fontSize = Object.fromEntries(
  Object.entries(typography.size).map(([name, def]) => [
    name,
    [
      px(def.size),
      {
        lineHeight: px(def.lineHeight),
        fontWeight: `${def.weight}`,
        letterSpacing:
          name.startsWith('heading') || name.startsWith('display')
            ? typography.letterSpacing.heading
            : typography.letterSpacing.body,
      },
    ],
  ]),
)

export default {
  theme: {
    screens: pxScale(breakpoint),
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      // primitive scales (prefer the semantic groups below in components)
      brand: color.brand,
      neutral: color.neutral,
      success: color.success,
      warning: color.warning,
      error: color.error,
      info: color.info,
      approval: color.approval,
      platform: color.platform,
      // semantic groups → bg-bg-page, text-text-primary, border-border, ...
      bg: semanticColor.bg,
      text: semanticColor.text,
      border: semanticColor.border,
      action: semanticColor.action,
      link: semanticColor.link,
    },
    spacing: pxScale(space),
    borderRadius: pxScale(radius),
    boxShadow: { ...shadow },
    fontFamily: { sans: typography.fontFamily },
    fontSize: {
      ...fontSize,
      'icon-sm': [px(typography.iconSize.sm), { lineHeight: '1' }],
      'icon-md': [px(typography.iconSize.md), { lineHeight: '1' }],
      'icon-lg': [px(typography.iconSize.lg), { lineHeight: '1' }],
    },
    fontWeight: {
      regular: `${typography.weight.regular}`,
      medium: `${typography.weight.medium}`,
      semibold: `${typography.weight.semibold}`,
      bold: `${typography.weight.bold}`,
    },
    letterSpacing: { ...typography.letterSpacing },
    // Replaces Tailwind's z-0…z-50 defaults so §10 is the only reachable scale.
    zIndex: Object.fromEntries(Object.entries(zIndex).map(([key, value]) => [key, `${value}`])),
    transitionDuration: {
      DEFAULT: ms(motion.duration.base),
      fast: ms(motion.duration.fast),
      base: ms(motion.duration.base),
      slow: ms(motion.duration.slow),
      drawer: ms(motion.duration.drawer),
    },
    transitionTimingFunction: { DEFAULT: motion.easing.standard, ...motion.easing },
    extend: {
      width: {
        sidebar: px(layout.sidebarWidth),
        'sidebar-collapsed': px(layout.sidebarCollapsedWidth),
        'table-settings': px(componentToken.table.settingsPanelWidth),
      },
      maxHeight: { 'table-settings': px(componentToken.table.settingsPanelMaxHeight) },
      height: { chart: px(componentToken.chart.height) },
      maxWidth: { narrow: px(layout.containerNarrow) },
    },
  },
} satisfies Config

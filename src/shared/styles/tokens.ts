/**
 * Design tokens — the ONLY place raw design values (hex, px, ms) may exist.
 * Every value below is copied or derived from design.md; the section is noted
 * next to each group. Two consumers read this file:
 *   - tailwind.config.ts  → Tailwind theme (utility classes)
 *   - shared/components/ant/theme.ts → antd ConfigProvider theme
 * Never hardcode a hex/px in components, Tailwind arbitrary values, or inline
 * styles — add or derive a token here instead (design.md §49).
 */

/** Primitive color scales — design.md §3.1, §3.2, §3.4, §3.6. */
export const color = {
  brand: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C22',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  success: { 50: '#F0FDF4', 100: '#DCFCE7', 500: '#22C55E', 700: '#15803D', 900: '#14532D' },
  warning: { 50: '#FEFCE8', 100: '#FEF9C3', 500: '#EAB308', 700: '#A16207', 900: '#713F12' },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    900: '#7F1D1D',
  },
  info: { 50: '#EFF6FF', 100: '#DBEAFE', 500: '#3B82F6', 700: '#1D4ED8', 900: '#1E3A8A' },
  approval: { 50: '#FAF5FF', 100: '#F3E8FF', 500: '#A855F7', 700: '#7E22CE', 900: '#581C87' },
  /**
   * AI surfaces only (the "Create with AI" button and assistant). Kept apart from `approval`,
   * whose purple means a workflow state.
   */
  ai: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#8B7CF6',
    500: '#7C5CF5',
    600: '#6D45E8',
    700: '#5B32CC',
    800: '#3A2A8C',
    900: '#221B57',
  },
  /**
   * Secondary data-visualization hue (orange) for series that contrast with the brand green,
   * e.g. unfollows or comparison categories. Charts only, never UI chrome.
   */
  accent: { 50: '#FBF5EF', 100: '#FBEBDC', 300: '#E9A45C', 500: '#D9822B', 700: '#A65A12' },
  /** Contextual identifiers only — never product-brand surfaces (design.md §3.6). */
  platform: {
    facebook: '#1877F2',
    tiktok: '#111111',
    /** TikTok's own pink and cyan, only inside the TikTok post preview. */
    tiktokPink: '#FE2C55',
    tiktokCyan: '#25F4EE',
  },
} as const

/** Semantic light-mode mapping — design.md §3.3. */
export const semanticColor = {
  bg: {
    page: color.neutral[50],
    surface: color.neutral[0],
    'surface-subtle': color.neutral[50],
    'surface-muted': color.neutral[100],
    elevated: color.neutral[0],
    disabled: color.neutral[100],
  },
  text: {
    primary: color.neutral[900],
    secondary: color.neutral[700],
    tertiary: color.neutral[600],
    disabled: color.neutral[400],
    inverse: color.neutral[0],
  },
  border: {
    subtle: color.neutral[200],
    DEFAULT: color.neutral[300],
    strong: color.neutral[300],
    focus: color.brand[500],
  },
  action: {
    primary: color.brand[600],
    'primary-hover': color.brand[700],
    'primary-active': color.brand[800],
    subtle: color.brand[50],
    text: color.brand[700],
  },
  link: { DEFAULT: color.brand[700], hover: color.brand[800] },
} as const

/** Spacing scale (px) — 4px base, 8px rhythm — design.md §6. */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const

/** Border radius scale (px) — design.md §7. */
export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  /** Standard product radius. Larger radii are reserved for exceptional surfaces only. */
  xl: 8,
  '2xl': 16,
  '3xl': 24,
  pill: 9999,
  full: 9999,
} as const

/** Typography — design.md §5 (family, weights, scale, letter spacing) + §11 (icon sizes). */
export const typography = {
  fontFamily: 'Inter, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  size: {
    'display-lg': { size: 48, lineHeight: 60, weight: 600 },
    'display-sm': { size: 30, lineHeight: 38, weight: 600 },
    'heading-1': { size: 24, lineHeight: 32, weight: 600 },
    'heading-2': { size: 20, lineHeight: 30, weight: 600 },
    'heading-3': { size: 18, lineHeight: 28, weight: 600 },
    'heading-4': { size: 16, lineHeight: 24, weight: 600 },
    'body-lg': { size: 18, lineHeight: 28, weight: 400 },
    'body-md': { size: 16, lineHeight: 24, weight: 400 },
    'body-sm': { size: 14, lineHeight: 20, weight: 400 },
    'label-md': { size: 14, lineHeight: 20, weight: 500 },
    'label-sm': { size: 12, lineHeight: 18, weight: 500 },
    caption: { size: 12, lineHeight: 18, weight: 400 },
    micro: { size: 12, lineHeight: 18, weight: 500 },
  },
  letterSpacing: { body: '0', heading: '0', kpi: '-0.02em', caps: '0.04em' },
  /** Icon sizes — design.md §17. */
  iconSize: { sm: 16, md: 20, lg: 32 },
} as const

/** Elevation — design.md §9. */
export const shadow = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.10), 0 1px 2px -1px rgba(0, 0, 0, 0.10)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.10), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
  lg: '0 12px 16px -4px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03), 0 2px 2px -1px rgba(0, 0, 0, 0.04)',
} as const

/** Motion durations (ms) and easings — design.md §22. */
export const motion = {
  duration: { fast: 120, base: 180, slow: 240, drawer: 280 },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const

/** Control heights — SocialOps keeps sm compact filters, md default, lg onboarding. */
/** Compact operational controls: 32px icon/small, 36px default, 40px large. */
export const control = {
  heightXs: 28,
  heightSm: 32,
  height: 36,
  heightLg: 40,
  heightXl: 44,
} as const

/** Z-index scale — design.md §10. Nothing may invent a value outside this scale. */
export const zIndex = {
  base: 0,
  sticky: 100,
  header: 200,
  dropdown: 500,
  popover: 600,
  tooltip: 700,
  drawer: 800,
  modal: 900,
  toast: 1000,
} as const

/**
 * Focus ring — Untitled UI uses the brand-500 family for focus.
 */
export const focusRing = { width: 2, color: color.brand[100] } as const

/** Avatar sizes (px) — design.md §18. */
export const avatarSize = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64, xxl: 96 } as const

/** Layout dimensions (px) — sidebar §15.2, narrow reading width §25. */
export const layout = {
  sidebarWidth: 232,
  sidebarCollapsedWidth: 72,
  sidebarDrawerWidth: 280,
  drawerCompactWidth: 440,
  drawerNormalWidth: 600,
  drawerWideWidth: 760,
  containerNarrow: 720,
  authPanelWidth: 440,
} as const

/** Responsive breakpoints (px) — design.md §26. */
export const breakpoint = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

/**
 * Layer 3 — component tokens (design.md §2.1). Values design.md states for a
 * specific component rather than as a global semantic. Consumed by the antd
 * theme; components must not restate them.
 */
export const componentToken = {
  toast: {
    offset: space[6],
    durationSeconds: 4,
    maxCount: 4,
    stackThreshold: 3,
  },
  profile: {
    coverHeight: 200,
    avatarPreviewSize: 192,
  },
  /** design.md §12 — variants, sizes and states of the button. */
  button: {
    // Untitled UI button heights: 32 / 36 / 40 / 44 / 48
    paddingInlineXs: space[3],
    paddingInlineSm: space[3],
    paddingInline: space[4],
    paddingInlineLg: space[5],
    paddingInlineXl: space[5],
    fontSizeXs: typography.size.caption.size,
    fontSizeSm: typography.size['body-sm'].size,
    fontSize: typography.size['body-md'].size,
    fontSizeLg: typography.size['body-lg'].size,
    fontSizeXl: typography.size['body-lg'].size,
    primaryText: semanticColor.text.inverse,
    disabledBg: color.neutral[100],
    disabledBorder: color.neutral[200],
    secondaryText: color.neutral[700],
    secondaryBg: semanticColor.bg.surface,
    secondaryBorder: semanticColor.border.DEFAULT,
    secondaryHoverBg: color.neutral[50],
    secondaryActiveBg: color.neutral[100],
    ghostText: color.neutral[600],
    ghostHoverBg: color.neutral[100],
    ghostActiveBg: color.neutral[200],
    destructiveBg: color.error[600],
    destructiveHoverBg: color.error[900],
  },
  /** design.md §20 — dropdown menu item metrics. */
  dropdown: {
    itemPaddingBlock: space[2],
  },
  media: {
    removeButtonSize: 22,
  },
  tabs: {
    /** Border treatment for the compact solid-tab track without changing its height. */
    solidTrackOutline: `inset 0 0 0 1px ${semanticColor.border.subtle}`,
    solidActiveOutline: `inset 0 0 0 1px ${semanticColor.border.DEFAULT}`,
  },
  /** Shared dashboard chart geometry. */
  chart: {
    height: space[20] * 3,
    lineWidth: 2,
    pointRadius: radius.sm,
    barRadius: radius.lg,
    gridDash: `${space[1]} ${space[1]}`,
    margin: { top: space[2], right: space[2], bottom: 0, left: -space[4] },
  },
  /** design.md §27, §30, §68 — compact operational table geometry. */
  table: {
    columnWidth: space[5] * 10,
    columnMinWidth: space[10] * 2,
    columnMaxWidth: space[10] * 12,
    selectionColumnWidth: space[12],
    keyboardResizeStep: space[4],
    settingsPanelWidth: space[10] * 8,
    settingsPanelMaxHeight: space[10] * 12,
    columnPreset: {
      actions: space[24],
      compact: space[10] * 3,
      default: space[5] * 10,
      wide: space[10] * 6,
      content: space[10] * 8,
    },
  },
} as const

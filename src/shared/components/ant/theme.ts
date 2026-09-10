import type { ThemeConfig } from 'antd'
import {
  color,
  componentToken,
  control,
  focusRing,
  motion,
  radius,
  semanticColor,
  shadow,
  space,
  typography,
  zIndex,
} from '@/shared/styles/tokens'

/**
 * antd consumer of the token file — maps design.md values (via tokens.ts) into
 * ConfigProvider theme, following the override priority of design.md §41:
 * global tokens first, component tokens second. Anything that cannot be
 * expressed here goes through the platform component in shared/ui, never a
 * global `.ant-*` selector. No raw hex/px in this file.
 */
export const antTheme: ThemeConfig = {
  token: {
    // Brand / actions — solid emerald CTA, brand only where emphasis is needed.
    colorPrimary: semanticColor.action.primary,
    colorPrimaryHover: semanticColor.action['primary-hover'],
    colorPrimaryActive: semanticColor.action['primary-active'],
    colorLink: semanticColor.link.DEFAULT,
    colorLinkHover: semanticColor.link.hover,

    // Surfaces
    colorBgBase: color.neutral[0],
    colorBgContainer: semanticColor.bg.surface,
    colorBgLayout: semanticColor.bg.page,
    colorBgElevated: semanticColor.bg.elevated,
    // Disabled inputs sit on a muted neutral surface.
    colorBgContainerDisabled: semanticColor.bg.disabled,

    // Text
    colorText: semanticColor.text.primary,
    colorTextSecondary: semanticColor.text.secondary,
    colorTextTertiary: semanticColor.text.tertiary,
    colorTextDisabled: semanticColor.text.disabled,
    colorTextLightSolid: semanticColor.text.inverse,

    // Borders
    colorBorder: semanticColor.border.DEFAULT,
    colorBorderSecondary: semanticColor.border.subtle,
    colorSplit: semanticColor.border.subtle,
    lineWidth: 1,

    // Status (design.md §3.4)
    colorSuccess: color.success[500],
    colorWarning: color.warning[500],
    colorError: color.error[500],
    colorInfo: color.info[500],

    // Shape
    borderRadius: radius.lg,
    borderRadiusLG: radius.xl,
    borderRadiusSM: radius.md,
    borderRadiusXS: radius.sm,

    // Controls
    controlHeight: control.height,
    controlHeightSM: control.heightSm,
    controlHeightLG: control.heightLg,

    // Focus ring
    controlOutline: focusRing.color,
    controlOutlineWidth: focusRing.width,
    lineWidthFocus: focusRing.width,

    // Typography
    fontFamily: typography.fontFamily,
    fontSize: typography.size['body-md'].size,
    lineHeight: typography.size['body-md'].lineHeight / typography.size['body-md'].size,

    // Elevation
    boxShadow: shadow.md,
    boxShadowSecondary: shadow.md,
    boxShadowTertiary: shadow.xs,

    // Motion
    motionDurationFast: `${motion.duration.fast}ms`,
    motionDurationMid: `${motion.duration.base}ms`,
    motionDurationSlow: `${motion.duration.slow}ms`,
    motionEaseInOut: motion.easing.standard,
    motionEaseOut: motion.easing.enter,

    // Stacking
    zIndexPopupBase: zIndex.dropdown,
  },
  components: {
    Button: {
      // Untitled-style buttons: medium weight, no decorative shadow, 8px icon gap.
      fontWeight: typography.weight.medium,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
      iconGap: space[2],
      onlyIconSize: typography.iconSize.sm,

      // Current platform API exposes sm / md / lg, mapped to compact / default / onboarding.
      paddingInlineSM: componentToken.button.paddingInlineSm,
      paddingInline: componentToken.button.paddingInline,
      paddingInlineLG: componentToken.button.paddingInlineLg,
      contentFontSizeSM: componentToken.button.fontSizeSm,
      contentFontSize: componentToken.button.fontSize,
      contentFontSizeLG: componentToken.button.fontSizeLg,

      // Solid primary.
      primaryColor: componentToken.button.primaryText,
      colorBgContainerDisabled: componentToken.button.disabledBg,
      borderColorDisabled: componentToken.button.disabledBorder,

      // Secondary / outlined.
      defaultColor: componentToken.button.secondaryText,
      defaultBg: componentToken.button.secondaryBg,
      defaultBorderColor: componentToken.button.secondaryBorder,
      defaultHoverBg: componentToken.button.secondaryHoverBg,
      defaultHoverColor: componentToken.button.secondaryText,
      defaultHoverBorderColor: componentToken.button.secondaryBorder,
      defaultActiveBg: componentToken.button.secondaryActiveBg,
      defaultActiveColor: componentToken.button.secondaryText,
      defaultActiveBorderColor: componentToken.button.secondaryBorder,

      // Tertiary / ghost.
      textTextColor: componentToken.button.ghostText,
      textTextHoverColor: componentToken.button.ghostText,
      textTextActiveColor: componentToken.button.ghostText,
      textHoverBg: componentToken.button.ghostHoverBg,

      // Destructive.
      colorError: componentToken.button.destructiveBg,
      colorErrorHover: componentToken.button.destructiveHoverBg,
      colorErrorActive: componentToken.button.destructiveHoverBg,
      dangerColor: componentToken.button.primaryText,
    },
    // A dropdown menu is styled by Dropdown's own tokens, not Menu's — antd
    // reads borderRadiusSM / colorError / controlItemBg* here, so the Menu
    // component tokens would be silently ignored.
    Dropdown: {
      // Neutral menu surface, subtle selected/hover states.
      borderRadiusLG: radius.lg,
      borderRadiusSM: radius.md,
      paddingBlock: componentToken.dropdown.itemPaddingBlock,
      controlItemBgActive: semanticColor.bg['surface-muted'],
      controlItemBgActiveHover: color.neutral[200],
      controlItemBgHover: semanticColor.bg['surface-muted'],
      colorPrimary: semanticColor.text.primary,
      colorError: color.error[600],
      zIndexPopup: zIndex.dropdown,
    },
    Tooltip: {
      // §19 / §40.15: one consistent neutral tooltip
      colorBgSpotlight: color.neutral[800],
      borderRadius: radius.md,
      zIndexPopup: zIndex.tooltip,
    },
    Divider: {
      // §8: dividers are the subtle 1px hairline, not a container border
      colorSplit: semanticColor.border.subtle,
    },
    Input: {
      activeBorderColor: semanticColor.border.focus,
      hoverBorderColor: semanticColor.border.strong,
      activeShadow: `0 0 0 ${focusRing.width}px ${focusRing.color}`,
      colorBgContainer: semanticColor.bg.surface,
      colorBorder: semanticColor.border.DEFAULT,
      colorText: semanticColor.text.primary,
      colorTextPlaceholder: semanticColor.text.disabled,
    },
    Select: {
      activeBorderColor: semanticColor.border.focus,
      hoverBorderColor: semanticColor.border.strong,
      activeOutlineColor: focusRing.color,
      optionActiveBg: semanticColor.bg['surface-muted'],
      optionSelectedBg: semanticColor.bg['surface-muted'],
      optionSelectedColor: semanticColor.text.primary,
    },
    DatePicker: {
      activeBorderColor: semanticColor.border.focus,
      hoverBorderColor: semanticColor.border.strong,
      activeShadow: `0 0 0 ${focusRing.width}px ${focusRing.color}`,
    },
    Checkbox: {
      colorPrimary: semanticColor.action.primary,
      colorPrimaryHover: semanticColor.action['primary-hover'],
      borderRadiusSM: radius.sm,
    },
    Tabs: {
      itemColor: semanticColor.text.tertiary,
      itemHoverColor: semanticColor.text.primary,
      itemSelectedColor: semanticColor.text.primary,
      inkBarColor: semanticColor.border.strong,
      titleFontSize: typography.size['body-sm'].size,
    },
    Segmented: {
      trackBg: semanticColor.bg['surface-muted'],
      // Solid tabs sit flush in a 36px track; selected state must not add an
      // extra 4px inset around every item.
      trackPadding: space[0],
      itemColor: color.neutral[500],
      itemActiveBg: semanticColor.bg.surface,
      itemSelectedBg: semanticColor.bg.surface,
      itemSelectedColor: color.neutral[700],
      // Ant applies this token to the selected thumb/item, so active white
      // tabs retain a visible neutral edge without changing their 36px height.
      boxShadowTertiary: componentToken.tabs.solidActiveOutline,
    },
    Card: {
      colorBgContainer: semanticColor.bg.surface,
      colorBorderSecondary: semanticColor.border.subtle,
      borderRadiusLG: radius.xl,
      bodyPadding: space[4],
      headerFontSize: typography.size['heading-4'].size,
    },
    Statistic: {
      titleFontSize: typography.size['body-sm'].size,
      contentFontSize: typography.size['heading-1'].size,
      colorTextDescription: semanticColor.text.tertiary,
    },
    Progress: {
      defaultColor: semanticColor.action.primary,
      remainingColor: semanticColor.bg['surface-muted'],
      lineBorderRadius: radius.pill,
    },
    Tag: {
      defaultBg: semanticColor.bg['surface-muted'],
      defaultColor: semanticColor.text.secondary,
      borderRadiusSM: radius.pill,
    },
    Modal: {
      contentBg: semanticColor.bg.surface,
      headerBg: semanticColor.bg.surface,
      titleColor: semanticColor.text.primary,
      titleFontSize: typography.size['heading-4'].size,
      borderRadiusLG: radius['2xl'],
    },
    Drawer: {
      colorBgElevated: semanticColor.bg.surface,
    },
    Skeleton: {
      gradientFromColor: semanticColor.bg['surface-muted'],
      gradientToColor: color.neutral[200],
    },
  },
}

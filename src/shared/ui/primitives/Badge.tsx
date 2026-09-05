import type { ComponentPropsWithRef } from 'react'
import { color } from '@/shared/styles/tokens'

/**
 * Shared count indicator. Defaults to a quiet inline pill; corner placement
 * supports compact notification counts on buttons and other controls.
 *
 * DOM props and ref are forwarded so the pill can be the child of a trigger
 * such as <Tooltip/>, which injects hover handlers into its child.
 */
export type BadgeProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & {
  count: number | string
  tone?: 'neutral' | 'danger'
  placement?: 'inline' | 'corner'
}

export function Badge({
  count,
  tone = 'neutral',
  placement = 'inline',
  className,
  style,
  ...rest
}: BadgeProps) {
  const toneClass =
    tone === 'danger'
      ? 'bg-error-600 text-white'
      : 'border border-border-subtle bg-bg-surface-subtle text-text-tertiary'
  const placementClass =
    placement === 'corner'
      ? 'absolute -end-2 -top-2 z-10 h-5 min-w-5 px-1 text-caption'
      : 'h-6 min-w-6 px-2 text-label-sm'

  return (
    <span
      {...rest}
      style={tone === 'danger' ? { ...style, color: color.neutral[0] } : style}
      className={`inline-flex items-center justify-center rounded-pill tabular-nums ${toneClass} ${placementClass} ${className ?? ''}`}
    >
      {count}
    </span>
  )
}

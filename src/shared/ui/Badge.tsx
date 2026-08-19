import type { ComponentPropsWithRef } from 'react'

/**
 * Quiet count pill (design.md §17: 24px height, pill radius, label-sm on a
 * soft neutral tint, §5.5 tabular numerals). Kit-free on purpose: antd's Badge
 * is a red notification dot and would need to be fought into this shape.
 *
 * DOM props and ref are forwarded so the pill can be the child of a trigger
 * such as <Tooltip/>, which injects hover handlers into its child.
 */
export type BadgeProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & { count: number }

export function Badge({ count, className, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      className={`inline-flex h-6 min-w-6 items-center justify-center rounded-pill border border-border-subtle bg-bg-surface-subtle px-2 text-label-sm tabular-nums text-text-tertiary ${className ?? ''}`}
    >
      {count}
    </span>
  )
}

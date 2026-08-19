import type { ReactNode } from 'react'

export type SectionLabelProps = {
  children: ReactNode
  className?: string
  /** Render as a heading where the group is a real document section (design.md §24 semantics). */
  as?: 'span' | 'h2'
}

/**
 * Small uppercase group heading shared by nav sections and pickers, so the
 * rule lives in one place instead of being re-typed per screen.
 */
export function SectionLabel({ children, className, as: Tag = 'span' }: SectionLabelProps) {
  return (
    <Tag className={`text-label-sm uppercase tracking-caps text-text-tertiary ${className ?? ''}`}>
      {children}
    </Tag>
  )
}

import type { ReactNode } from 'react'

export type TabOption<T extends string> = { value: T; label: ReactNode; disabled?: boolean }
export type TabsProps<T extends string> = {
  value: T
  options: readonly TabOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  /** Neutral segmented tabs are the default product pattern; line is available for dense contexts. */
  variant?: 'solid' | 'line' | 'transparent'
  /** Placement and width from the layout around it, e.g. `w-full` or an order. */
  className?: string
  /** Solid tabs share the whole width equally, as on a phone. */
  block?: boolean
}

export { Tabs } from '@/shared/components/ant/Tabs'

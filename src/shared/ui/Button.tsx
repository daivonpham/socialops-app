import type { MouseEventHandler, ReactNode } from 'react'

/** Platform-owned button API (design.md §12) — implemented by the active adapter. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  loading?: boolean
  disabled?: boolean
  htmlType?: 'button' | 'submit'
  className?: string
  children?: ReactNode
  onClick?: MouseEventHandler<HTMLElement>
  'aria-label'?: string
}

export { Button } from '@/shared/components/ant/Button'

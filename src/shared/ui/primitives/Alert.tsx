import type { ReactNode } from 'react'

/** Trailing call-to-action chip of the `pill` variant; opens `href` in a new tab or runs `onClick`. */
export type AlertPillAction = {
  label: ReactNode
  href?: string
  onClick?: () => void
}

export type AlertProps = {
  tone: 'success' | 'info' | 'warning' | 'error'
  /** `pill`: compact inline banner (title + optional `pillAction` chip) for short confirmations. */
  variant?: 'default' | 'soft' | 'pill'
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  pillAction?: AlertPillAction
  closable?: boolean
  onClose?: () => void
}

export { Alert } from '@/shared/components/ant/Alert'

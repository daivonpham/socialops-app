import type { ReactNode } from 'react'

export type ToastPlacement =
  'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight'

/** Underlined link under the message; opens `href` in a new tab or runs `onClick`, then closes the toast. */
export type ToastAction = {
  label: ReactNode
  href?: string
  onClick?: () => void
}

export type ToastOptions = {
  title: ReactNode
  description?: ReactNode
  action?: ToastAction
  duration?: number
  placement?: ToastPlacement
  onClose?: () => void
}

export type ToastApi = {
  success: (options: ToastOptions) => void
  info: (options: ToastOptions) => void
  warning: (options: ToastOptions) => void
  error: (options: ToastOptions) => void
  destroy: () => void
}

export { ToastProvider, useToast } from '@/shared/components/ant/Toast'

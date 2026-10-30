import type { ReactNode } from 'react'

export type ToastPlacement =
  'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight'

/**
 * Underlined link under the message; opens `href` in a new tab or runs `onClick`, then closes
 * the toast. When `onClick` returns a promise the toast stays open with the link loading until
 * the promise settles.
 */
export type ToastAction = {
  label: ReactNode
  href?: string
  onClick?: () => void | Promise<unknown>
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

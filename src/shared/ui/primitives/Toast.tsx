import type { ReactNode } from 'react'

export type ToastPlacement =
  'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight'

export type ToastOptions = {
  title: ReactNode
  description?: ReactNode
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

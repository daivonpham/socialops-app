import type { ReactNode } from 'react'

export type AlertProps = {
  tone: 'success' | 'info' | 'warning' | 'error'
  variant?: 'default' | 'soft'
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  closable?: boolean
  onClose?: () => void
}

export { Alert } from '@/shared/components/ant/Alert'

import type { ReactNode } from 'react'

export type ModalProps = {
  open: boolean
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}
export { Modal } from '@/shared/components/ant/Modal'

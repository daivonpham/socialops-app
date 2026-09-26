import type { ReactNode } from 'react'

export type ModalProps = {
  open: boolean
  title: ReactNode
  /** Optional leading visual shown above the modal title. */
  headerIcon?: ReactNode
  /** Optional supporting copy shown directly below the modal title. */
  headerDescription?: ReactNode
  /** Places the icon beside or above the title block. */
  headerLayout?: 'horizontal' | 'vertical'
  children: ReactNode
  footer?: ReactNode
  width?: number | string
  floatingClose?: boolean
  blurBackdrop?: boolean
  onClose: () => void
}
export { Modal } from '@/shared/components/ant/Modal'

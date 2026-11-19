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
  /** `false` shows the icon as is, without the bordered tile around it. */
  headerIconFramed?: boolean
  /** Decorative image URL painted edge to edge behind the header. */
  headerBackground?: string
  children: ReactNode
  footer?: ReactNode
  width?: number | string
  floatingClose?: boolean
  /** `none` removes the body padding, for dialogs that lay out their own panels edge to edge. */
  padding?: 'default' | 'none'
  blurBackdrop?: boolean
  /** Below 768px the dialog takes the whole screen, for ones built like an app view. */
  fullScreenOnPhone?: boolean
  onClose: () => void
}
export { Modal } from '@/shared/components/ant/Modal'

import { Modal as AntModal } from 'antd'
import type { ModalProps } from '@/shared/ui/primitives/Modal'

export function Modal({ open, title, children, footer, onClose }: ModalProps) {
  return (
    <AntModal open={open} title={title} footer={footer} onCancel={onClose} centered destroyOnHidden>
      {children}
    </AntModal>
  )
}

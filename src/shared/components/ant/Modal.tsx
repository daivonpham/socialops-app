import { Modal as AntModal } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import type { ModalProps } from '@/shared/ui/primitives/Modal'

export function Modal({
  open,
  title,
  children,
  footer,
  width,
  floatingClose = false,
  onClose,
}: ModalProps) {
  return (
    <AntModal
      open={open}
      title={title}
      footer={footer}
      width={width}
      className={floatingClose ? 'app-modal-floating-close' : undefined}
      closeIcon={
        floatingClose ? (
          <span className="app-modal-floating-close-icon flex size-12 items-center justify-center rounded-full border-2 border-bg-surface bg-action-primary text-icon-md text-text-inverse shadow-lg">
            <CloseOutlined />
          </span>
        ) : undefined
      }
      onCancel={onClose}
      centered
      destroyOnHidden
    >
      {children}
    </AntModal>
  )
}

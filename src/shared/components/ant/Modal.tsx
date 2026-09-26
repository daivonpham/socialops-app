import { Modal as AntModal } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import type { ModalProps } from '@/shared/ui/primitives/Modal'

export function Modal({
  open,
  title,
  headerIcon,
  headerDescription,
  headerLayout = 'horizontal',
  children,
  footer,
  width,
  floatingClose = false,
  blurBackdrop = false,
  onClose,
}: ModalProps) {
  return (
    <AntModal
      open={open}
      title={
        headerIcon || headerDescription ? (
          <div
            className={
              headerIcon && headerLayout === 'horizontal'
                ? 'flex items-start gap-4 pt-1'
                : 'pt-1'
            }
          >
            {headerIcon ? (
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-surface text-icon-md text-text-secondary shadow-xs ${headerLayout === 'vertical' ? 'mb-5' : ''}`}
              >
                {headerIcon}
              </span>
            ) : null}
            {title || headerDescription ? (
              <span className="min-w-0 pt-0.5">
                {title ? (
                  <span className="block text-heading-2 text-text-primary">{title}</span>
                ) : null}
                {headerDescription ? (
                  <span className="block text-body-sm font-normal text-text-secondary">
                    {headerDescription}
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>
        ) : (
          title
        )
      }
      footer={footer}
      width={width}
      className={floatingClose ? 'app-modal-floating-close' : undefined}
      rootClassName={blurBackdrop ? 'app-modal-blur-backdrop' : undefined}
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

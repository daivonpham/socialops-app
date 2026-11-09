import { Modal as AntModal } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import type { ModalProps } from '@/shared/ui/primitives/Modal'

export function Modal({
  open,
  title,
  headerIcon,
  headerDescription,
  headerLayout = 'horizontal',
  headerIconFramed = true,
  headerBackground,
  children,
  footer,
  width,
  floatingClose = false,
  padding = 'default',
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
              headerBackground
                ? // A 70px band that bleeds over the content padding to reach the modal edges.
                  'flex h-[70px] items-center gap-4 -mx-6 -mt-5 rounded-t-2xl bg-no-repeat pe-12 ps-6'
                : headerIcon && headerLayout === 'horizontal'
                  ? 'flex items-start gap-4 pt-1'
                  : 'pt-1'
            }
            style={
              headerBackground
                ? {
                    backgroundImage: `url("${headerBackground}")`,
                    backgroundSize: '80% 80%',
                    backgroundPosition: 'right top',
                  }
                : undefined
            }
          >
            {headerIcon ? (
              <span
                className={
                  'flex shrink-0 items-center justify-center ' +
                  (headerIconFramed
                    ? 'size-12 rounded-lg border border-border-subtle bg-bg-surface text-icon-md text-text-secondary shadow-xs '
                    : '') +
                  (headerLayout === 'vertical' ? 'mb-5' : '')
                }
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
      styles={padding === 'none' ? { content: { padding: 0, overflow: 'hidden' } } : undefined}
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

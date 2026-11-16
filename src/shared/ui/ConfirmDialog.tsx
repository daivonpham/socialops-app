import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, IconDelete, IconInfo, Modal } from './primitives'

export type ConfirmDialogProps = {
  open: boolean
  title: ReactNode
  description?: ReactNode
  /** Defaults to a trash icon for destructive dialogs and an info icon otherwise. */
  icon?: ReactNode
  tone?: 'destructive' | 'primary'
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  loading?: boolean
  confirmDisabled?: boolean
  /** Extra body content, e.g. a type-to-confirm field or an error alert. */
  children?: ReactNode
  onConfirm: () => void
  onClose: () => void
}

/** Both actions keep half the width each; a label too long for it ends in "…" instead of overflowing. */
const ACTION_CLASS =
  'w-full min-w-0 [&.ant-btn]:min-w-0 [&_.ant-btn]:min-w-0 [&_.ant-btn]:w-full [&_.ant-btn>span]:truncate [&.ant-btn>span]:truncate'

/**
 * The one confirmation pattern for the whole app: icon, title, description and two
 * equal-width actions. Callers keep domain copy; this owns the layout.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  icon,
  tone = 'destructive',
  confirmLabel,
  cancelLabel,
  loading = false,
  confirmDisabled = false,
  children,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common')
  const destructive = tone === 'destructive'
  const close = () => {
    if (!loading) onClose()
  }

  return (
    <Modal
      open={open}
      title={title}
      headerIcon={
        icon ??
        (destructive ? (
          <IconDelete aria-hidden className="text-error-700" />
        ) : (
          <IconInfo aria-hidden className="text-brand-700" />
        ))
      }
      headerDescription={description}
      headerLayout="vertical"
      width={400}
      onClose={close}
      footer={
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button className={ACTION_CLASS} disabled={loading} onClick={close}>
            {cancelLabel ?? t('confirmDialog.cancel')}
          </Button>
          <Button
            className={ACTION_CLASS}
            variant={destructive ? 'destructive' : 'primary'}
            loading={loading}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel ?? (destructive ? t('confirmDialog.delete') : t('confirmDialog.confirm'))}
          </Button>
        </div>
      }
    >
      {children ? <div className="grid gap-4 pt-2">{children}</div> : null}
    </Modal>
  )
}

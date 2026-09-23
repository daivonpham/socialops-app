import { Alert as AntAlert } from 'antd'
import type { AlertProps } from '@/shared/ui/primitives/Alert'

export function Alert({
  tone,
  variant = 'default',
  title,
  description,
  action,
  closable,
  onClose,
}: AlertProps) {
  const isSoft = variant === 'soft'

  return (
    <AntAlert
      className={isSoft ? `app-alert--soft app-alert--soft-${tone}` : undefined}
      type={tone}
      message={title}
      description={description}
      action={action}
      closable={closable}
      onClose={onClose}
      showIcon
    />
  )
}

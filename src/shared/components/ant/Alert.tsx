import { Alert as AntAlert } from 'antd'
import type { AlertProps } from '@/shared/ui/primitives/Alert'

export function Alert({ tone, title, description, action, closable, onClose }: AlertProps) {
  return (
    <AntAlert
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

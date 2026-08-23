import { Tag } from 'antd'
import type { StatusTagProps, StatusTone } from '@/shared/ui/StatusTag'

const TONES: Record<StatusTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
  info: 'bg-info-50 text-info-700',
  brand: 'bg-brand-50 text-brand-700',
}

export function StatusTag({ children, tone = 'neutral' }: StatusTagProps) {
  return (
    <Tag bordered={false} className={`m-0 rounded-pill px-2 py-1 text-label-sm ${TONES[tone]}`}>
      {children}
    </Tag>
  )
}

import { Tag } from 'antd'
import type { StatusTagProps, StatusTone } from '@/shared/ui/StatusTag'

const TONES: Record<StatusTone, string> = {
  neutral: 'bg-neutral-600 text-text-inverse',
  success: 'bg-success-500 text-text-inverse',
  warning: 'bg-warning-700 text-text-inverse',
  error: 'bg-error-600 text-text-inverse',
  info: 'bg-info-500 text-text-inverse',
  brand: 'bg-brand-600 text-text-inverse',
}

export function StatusTag({ children, tone = 'neutral' }: StatusTagProps) {
  return (
    <Tag bordered={false} className={`m-0 rounded-pill px-2 py-1 text-label-sm ${TONES[tone]}`}>
      {children}
    </Tag>
  )
}

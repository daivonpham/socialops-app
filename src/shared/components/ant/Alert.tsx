import { Alert as AntAlert } from 'antd'
import type { AlertPillAction, AlertProps } from '@/shared/ui/primitives/Alert'
import { IconArrowRight } from './icons'

const PILL_TONE: Record<AlertProps['tone'], { surface: string; chip: string; arrow: string }> = {
  success: {
    surface: 'border-success-100 bg-success-50 text-success-700',
    chip: 'border-success-100',
    arrow: 'text-success-500',
  },
  info: {
    surface: 'border-info-100 bg-info-50 text-info-700',
    chip: 'border-info-100',
    arrow: 'text-info-500',
  },
  warning: {
    surface: 'border-warning-100 bg-warning-50 text-warning-700',
    chip: 'border-warning-100',
    arrow: 'text-warning-500',
  },
  error: {
    surface: 'border-error-100 bg-error-50 text-error-700',
    chip: 'border-error-100',
    arrow: 'text-error-500',
  },
}

function PillAlert({
  tone,
  title,
  pillAction,
}: Pick<AlertProps, 'tone' | 'title'> & { pillAction?: AlertPillAction }) {
  const styles = PILL_TONE[tone]
  const chipClass = `inline-flex shrink-0 items-center gap-1 rounded-pill border bg-bg-elevated px-3 py-1 text-label-md transition-colors hover:bg-bg-surface-subtle focus-visible:focus-ring ${styles.chip}`
  const chipContent = (
    <>
      {pillAction?.label}
      <IconArrowRight aria-hidden className={`text-icon-sm ${styles.arrow}`} />
    </>
  )

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`inline-flex max-w-full items-center gap-3 rounded-pill border py-1 ps-4 text-label-md ${pillAction ? 'pe-1' : 'pe-4'} ${styles.surface}`}
    >
      <span className="min-w-0 py-1">{title}</span>
      {pillAction?.href ? (
        <a className={chipClass} href={pillAction.href} target="_blank" rel="noopener noreferrer">
          {chipContent}
        </a>
      ) : pillAction ? (
        <button type="button" className={chipClass} onClick={pillAction.onClick}>
          {chipContent}
        </button>
      ) : null}
    </div>
  )
}

export function Alert({
  tone,
  variant = 'default',
  title,
  description,
  action,
  pillAction,
  closable,
  onClose,
}: AlertProps) {
  if (variant === 'pill') return <PillAlert tone={tone} title={title} pillAction={pillAction} />

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

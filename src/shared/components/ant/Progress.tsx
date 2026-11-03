import { Progress as AntProgress } from 'antd'
import { color, semanticColor } from '@/shared/styles/tokens'
import type { ProgressProps } from '@/shared/ui/primitives/Progress'

const STROKE = {
  primary: semanticColor.action.primary,
  soft: color.brand[300],
  muted: color.neutral[300],
} as const

export function Progress({ percent, ariaLabel, tone = 'primary' }: ProgressProps) {
  return (
    <AntProgress
      percent={percent}
      showInfo={false}
      strokeColor={STROKE[tone]}
      aria-label={ariaLabel}
    />
  )
}

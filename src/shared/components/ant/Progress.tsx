import { Progress as AntProgress } from 'antd'
import type { ProgressProps } from '@/shared/ui/primitives/Progress'

export function Progress({ percent, ariaLabel }: ProgressProps) {
  return <AntProgress percent={percent} showInfo={false} aria-label={ariaLabel} />
}

import { Tooltip as AntTooltip } from 'antd'
import type { TooltipProps } from '@/shared/ui/primitives/Tooltip'

export function Tooltip({ title, placement = 'top', children }: TooltipProps) {
  return (
    <AntTooltip title={title} placement={placement}>
      {children}
    </AntTooltip>
  )
}

import { Popover as AntPopover } from 'antd'
import type { PopoverProps } from '@/shared/ui/primitives/Popover'

/** Ant adapter for arbitrary, domain-agnostic popover content. */
export function Popover({ content, placement = 'bottomRight', children }: PopoverProps) {
  return (
    <AntPopover
      trigger={['click']}
      placement={placement}
      content={<div className="-m-3">{content}</div>}
    >
      {children}
    </AntPopover>
  )
}

import { Popover as AntPopover } from 'antd'
import type { PopoverProps } from '@/shared/ui/primitives/Popover'
import { PopupSurface } from './PopupSurface'

/** Ant adapter for arbitrary, domain-agnostic popover content. */
export function Popover({ content, placement = 'bottomRight', children }: PopoverProps) {
  return (
    <AntPopover
      trigger={['click']}
      placement={placement}
      arrow={false}
      styles={{ body: { padding: 0, background: 'transparent', boxShadow: 'none' } }}
      content={<PopupSurface placement={placement}>{content}</PopupSurface>}
    >
      {children}
    </AntPopover>
  )
}

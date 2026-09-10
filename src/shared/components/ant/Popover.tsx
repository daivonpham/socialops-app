import { Popover as AntPopover } from 'antd'
import { cloneElement, useState, type ReactElement } from 'react'
import type { PopoverProps } from '@/shared/ui/primitives/Popover'
import { PopupSurface } from './PopupSurface'

/** Ant adapter for arbitrary, domain-agnostic popover content. */
export function Popover({ content, placement = 'bottomRight', children }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const triggerElement = children as ReactElement<{ className?: string }>
  const trigger = cloneElement(triggerElement, {
    className: `${triggerElement.props.className ?? ''} ${open ? 'control-active' : ''}`.trim(),
  })

  return (
    <AntPopover
      trigger={['click']}
      placement={placement}
      open={open}
      onOpenChange={setOpen}
      arrow={false}
      styles={{ body: { padding: 0, background: 'transparent', boxShadow: 'none' } }}
      content={<PopupSurface placement={placement}>{content}</PopupSurface>}
    >
      {trigger}
    </AntPopover>
  )
}

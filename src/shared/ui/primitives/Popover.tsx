import type { ReactElement, ReactNode } from 'react'

/** Platform-owned popover API — implemented by the active adapter. */
export type PopoverProps = {
  content: ReactNode
  placement?: 'bottom' | 'bottomLeft' | 'bottomRight'
  children: ReactElement
}

export { Popover } from '@/shared/components/ant/Popover'

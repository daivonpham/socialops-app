import type { ReactElement, ReactNode } from 'react'

/** Platform-owned popover API — implemented by the active adapter. */
export type PopoverProps = {
  content: ReactNode
  placement?: 'bottom' | 'bottomLeft' | 'bottomRight'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactElement
}

export { Popover } from '@/shared/components/ant/Popover'

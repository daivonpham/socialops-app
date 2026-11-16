import type { ReactNode } from 'react'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  placement?: 'left' | 'right'
  width?: 'navigation' | 'compact' | 'normal' | 'wide'
  /** Shows a close button at the end of the header, named by this label. */
  closeLabel?: string
  children: ReactNode
}

export { Drawer } from '@/shared/components/ant/Drawer'

import type { ReactNode } from 'react'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  placement?: 'left' | 'right'
  width?: number
  children: ReactNode
}

export { Drawer } from '@/shared/components/ant/Drawer'

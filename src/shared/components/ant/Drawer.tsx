import { Drawer as AntDrawer } from 'antd'
import { layout } from '@/shared/styles/tokens'
import type { DrawerProps } from '@/shared/ui/Drawer'

export function Drawer({
  open,
  onClose,
  title,
  placement = 'left',
  width = layout.sidebarDrawerWidth,
  children,
}: DrawerProps) {
  return (
    <AntDrawer
      open={open}
      onClose={onClose}
      placement={placement}
      title={title}
      width={width}
      closable={false}
      styles={{ body: { padding: 0 } }}
    >
      {children}
    </AntDrawer>
  )
}

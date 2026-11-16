import { Drawer as AntDrawer } from 'antd'
import { layout } from '@/shared/styles/tokens'
import { Button } from './Button'
import { IconClose } from './icons'
import type { DrawerProps } from '@/shared/ui/primitives/Drawer'

export function Drawer({
  open,
  onClose,
  title,
  placement = 'left',
  width = 'navigation',
  closeLabel,
  children,
}: DrawerProps) {
  return (
    <AntDrawer
      open={open}
      onClose={onClose}
      placement={placement}
      title={title}
      width={
        {
          navigation: layout.sidebarDrawerWidth,
          compact: layout.drawerCompactWidth,
          normal: layout.drawerNormalWidth,
          wide: layout.drawerWideWidth,
        }[width]
      }
      closable={false}
      extra={
        closeLabel ? (
          <Button
            size="sm"
            variant="ghost"
            icon={<IconClose aria-hidden />}
            aria-label={closeLabel}
            title={closeLabel}
            onClick={onClose}
          />
        ) : undefined
      }
      styles={{ body: { padding: 0 } }}
    >
      {children}
    </AntDrawer>
  )
}

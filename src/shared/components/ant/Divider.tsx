import { Divider as AntDivider } from 'antd'
import type { DividerProps } from '@/shared/ui/primitives/Divider'

export function Divider({ className, orientation = 'horizontal' }: DividerProps) {
  return <AntDivider type={orientation} className={className} />
}

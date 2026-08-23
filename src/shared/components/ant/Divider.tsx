import { Divider as AntDivider } from 'antd'
import type { DividerProps } from '@/shared/ui/primitives/Divider'

export function Divider({ className }: DividerProps) {
  return <AntDivider className={className} />
}

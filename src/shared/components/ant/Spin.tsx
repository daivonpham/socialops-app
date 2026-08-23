import { Spin as AntSpin } from 'antd'
import type { SpinProps } from '@/shared/ui/primitives/Spin'

const SIZE_MAP = { sm: 'small', md: 'default', lg: 'large' } as const

export function Spin({ size = 'md', className }: SpinProps) {
  return <AntSpin size={SIZE_MAP[size]} className={className} />
}

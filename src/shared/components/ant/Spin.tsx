import { LoadingOutlined } from '@ant-design/icons'
import { Spin as AntSpin } from 'antd'
import type { SpinProps } from '@/shared/ui/primitives/Spin'

const SIZE_MAP = { sm: 'small', md: 'default', lg: 'large' } as const

/** Ant colours the dots with the brand; the AI tone repaints them, or the ring, purple. */
const TONE_CLASS = {
  brand: '',
  ai: 'text-ai-500 [&_.ant-spin-dot-item]:bg-ai-500',
} as const

export function Spin({ size = 'md', tone = 'brand', indicator = 'dots', className }: SpinProps) {
  return (
    <AntSpin
      size={SIZE_MAP[size]}
      indicator={indicator === 'ring' ? <LoadingOutlined spin /> : undefined}
      className={[TONE_CLASS[tone], className].filter(Boolean).join(' ')}
    />
  )
}

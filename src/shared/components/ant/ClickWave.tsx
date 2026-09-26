import Wave from 'antd/es/_util/wave'
import type { ClickWaveProps } from '@/shared/ui/primitives/ClickWave'

export function ClickWave({ children, disabled }: ClickWaveProps) {
  return <Wave disabled={disabled}>{children}</Wave>
}

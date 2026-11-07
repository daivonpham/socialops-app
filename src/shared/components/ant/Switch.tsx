import { Switch as AntSwitch } from 'antd'
import type { SwitchProps } from '@/shared/ui/primitives/Switch'

const AI_ON = '!bg-ai-500 hover:!bg-ai-600'

export function Switch({ tone = 'brand', checked, className, onChange, ...props }: SwitchProps) {
  return (
    <AntSwitch
      {...props}
      checked={checked}
      onChange={(next) => onChange?.(next)}
      className={[tone === 'ai' && checked ? AI_ON : '', className ?? ''].join(' ').trim()}
    />
  )
}

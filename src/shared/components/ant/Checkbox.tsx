import { Checkbox as AntCheckbox } from 'antd'
import type { CheckboxProps } from '@/shared/ui/primitives/Checkbox'

export function Checkbox({ onChange, ...props }: CheckboxProps) {
  return <AntCheckbox {...props} onChange={onChange} />
}

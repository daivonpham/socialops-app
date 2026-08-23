import { Input as AntInput } from 'antd'
import type { InputProps } from '@/shared/ui/primitives/Input'

export function Input({ label, hint, id, ...props }: InputProps) {
  const control = <AntInput id={id} {...props} />
  if (!label && !hint) return control
  return (
    <label className="grid gap-1.5 text-label-md text-text-secondary" htmlFor={id}>
      {label ? <span>{label}</span> : null}
      {control}
      {hint ? <span className="text-caption text-text-tertiary">{hint}</span> : null}
    </label>
  )
}

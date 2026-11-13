import { Input as AntInput } from 'antd'
import type { InputProps } from '@/shared/ui/primitives/Input'

const SIZE_MAP = { sm: 'small', md: 'middle', lg: 'large' } as const

export function Input({ label, hint, id, size = 'md', type, ...props }: InputProps) {
  const controlProps = { id, size: SIZE_MAP[size], ...props }
  const control =
    type === 'password' ? (
      <AntInput.Password {...controlProps} />
    ) : (
      <AntInput type={type} {...controlProps} />
    )
  if (!label && !hint) return control
  return (
    <label className="grid gap-1.5" htmlFor={id}>
      {label ? <span className="text-label-md text-text-secondary">{label}</span> : null}
      {control}
      {hint ? <span className="text-caption text-text-tertiary">{hint}</span> : null}
    </label>
  )
}

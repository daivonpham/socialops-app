import { Input } from 'antd'
import type { TextareaProps } from '@/shared/ui/primitives/Textarea'

export function Textarea({ label, hint, id, rows = 6, ...props }: TextareaProps) {
  return (
    <label className="grid gap-1.5 text-label-md text-text-secondary" htmlFor={id}>
      {label ? <span>{label}</span> : null}
      <Input.TextArea id={id} rows={rows} {...props} />
      {hint ? <span className="text-caption text-text-tertiary">{hint}</span> : null}
    </label>
  )
}

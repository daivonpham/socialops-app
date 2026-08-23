import type { ChangeEventHandler } from 'react'

export type TextareaProps = {
  value?: string
  defaultValue?: string
  onChange?: ChangeEventHandler<HTMLTextAreaElement>
  placeholder?: string
  className?: string
  id?: string
  label?: string
  hint?: string
  disabled?: boolean
  maxLength?: number
  rows?: number
  'aria-label'?: string
}

export { Textarea } from '@/shared/components/ant/Textarea'

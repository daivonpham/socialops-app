import type { ChangeEventHandler } from 'react'

export type InputProps = {
  value?: string
  defaultValue?: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  className?: string
  id?: string
  label?: string
  hint?: string
  disabled?: boolean
  type?: 'text' | 'search' | 'email'
  autoComplete?: string
  maxLength?: number
  'aria-label'?: string
}

export { Input } from '@/shared/components/ant/Input'

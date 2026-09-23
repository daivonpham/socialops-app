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
  readOnly?: boolean
  type?: 'text' | 'search' | 'email' | 'password' | 'datetime-local'
  size?: 'sm' | 'md' | 'lg'
  name?: string
  required?: boolean
  autoComplete?: string
  maxLength?: number
  minLength?: number
  allowClear?: boolean
  min?: string
  max?: string
  'aria-label'?: string
}

export { Input } from '@/shared/components/ant/Input'

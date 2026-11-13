import type { ChangeEventHandler, FocusEventHandler, KeyboardEventHandler, ReactNode } from 'react'

export type InputProps = {
  value?: string
  defaultValue?: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  autoFocus?: boolean
  placeholder?: string
  /** Leading visual inside the control, e.g. an email icon. */
  prefix?: ReactNode
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

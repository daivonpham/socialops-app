import type {
  ChangeEventHandler,
  ClipboardEventHandler,
  FocusEventHandler,
  KeyboardEventHandler,
} from 'react'

export type TextareaProps = {
  value?: string
  defaultValue?: string
  onChange?: ChangeEventHandler<HTMLTextAreaElement>
  onFocus?: FocusEventHandler<HTMLTextAreaElement>
  onBlur?: FocusEventHandler<HTMLTextAreaElement>
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>
  onPaste?: ClipboardEventHandler<HTMLTextAreaElement>
  placeholder?: string
  className?: string
  id?: string
  label?: string
  hint?: string
  disabled?: boolean
  maxLength?: number
  rows?: number
  /** Grows with the text between these row counts, then scrolls. */
  autoSize?: { minRows: number; maxRows: number }
  'aria-label'?: string
}

export { Textarea } from '@/shared/components/ant/Textarea'

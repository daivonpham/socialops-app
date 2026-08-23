import type { DragEventHandler, KeyboardEventHandler, MouseEventHandler, ReactNode } from 'react'

/** Platform-owned button API (design.md §12) — implemented by the active adapter. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  loading?: boolean
  disabled?: boolean
  htmlType?: 'button' | 'submit'
  className?: string
  children?: ReactNode
  onClick?: MouseEventHandler<HTMLElement>
  draggable?: boolean
  title?: string
  onDragStart?: DragEventHandler<HTMLElement>
  onDragOver?: DragEventHandler<HTMLElement>
  onDrop?: DragEventHandler<HTMLElement>
  onDragEnd?: DragEventHandler<HTMLElement>
  onKeyDown?: KeyboardEventHandler<HTMLElement>
  'aria-label'?: string
}

export { Button } from '@/shared/components/ant/Button'

import type { ReactNode } from 'react'

export type CheckboxProps = {
  checked?: boolean
  indeterminate?: boolean
  disabled?: boolean
  onChange?: (event: { target: { checked: boolean } }) => void
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  className?: string
  children?: ReactNode
  'aria-label'?: string
}

export { Checkbox } from '@/shared/components/ant/Checkbox'

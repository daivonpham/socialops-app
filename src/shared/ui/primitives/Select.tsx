import type { ReactNode } from 'react'

export type SelectOption = {
  value: string
  label: ReactNode
  searchText?: string
  disabled?: boolean
}
export type SelectProps = {
  value?: string
  defaultValue?: string
  onChange?: (event: { target: { value: string } }) => void
  options: readonly SelectOption[]
  label?: string
  className?: string
  id?: string
  disabled?: boolean
  showSearch?: boolean
  placeholder?: string
  'aria-label'?: string
}

export { Select } from '@/shared/components/ant/Select'

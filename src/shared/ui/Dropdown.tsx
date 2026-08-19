import type { ReactElement, ReactNode } from 'react'

/** Platform-owned dropdown menu API — implemented by the active adapter. */
export type DropdownMenuItem =
  | { type: 'divider' }
  | { key: string; label: ReactNode; icon?: ReactNode; disabled?: boolean; danger?: boolean }

export type DropdownFooter = {
  label: ReactNode
  icon?: ReactNode
  onClick?: () => void
}

export type DropdownProps = {
  items: DropdownMenuItem[]
  /** Marks the current choice (workspace/brand switchers). */
  selectedKey?: string
  onSelect?: (key: string) => void
  placement?: 'bottom' | 'bottomLeft' | 'bottomRight'
  /** When set, a search field is shown at the top of the panel. */
  searchPlaceholder?: string
  /** Optional action row under the list, e.g. "Create workspace". */
  footer?: DropdownFooter
  /** Trigger element. */
  children: ReactElement
}

export { Dropdown } from '@/shared/components/ant/Dropdown'

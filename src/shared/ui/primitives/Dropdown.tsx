import type { ReactElement, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown as AntDropdownAdapter } from '@/shared/components/ant/Dropdown'

/** Platform-owned dropdown menu API — implemented by the active adapter. */
export type DropdownMenuItem =
  | { type: 'divider' }
  | {
      key: string
      label: ReactNode
      searchText?: string
      icon?: ReactNode
      disabled?: boolean
      danger?: boolean
    }

export type DropdownFooter = {
  label: ReactNode
  icon?: ReactNode
  onClick?: () => void
}

export type DropdownProps = {
  /** Menu entries for simple selection dropdowns. */
  items?: DropdownMenuItem[]
  /** Arbitrary, domain-agnostic panel content such as a column-settings list. */
  content?: ReactNode
  /** Marks the current choice (workspace/brand switchers). */
  selectedKey?: string
  onSelect?: (key: string) => void
  placement?: 'bottom' | 'bottomLeft' | 'bottomRight'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** When set, a search field is shown at the top of the panel. */
  searchPlaceholder?: string
  /** Generic empty-search copy; shared/ui supplies the localized default. */
  emptyText?: ReactNode
  /** Optional action row under the list, e.g. "Create workspace". */
  footer?: DropdownFooter
  /** Trigger element. */
  children: ReactElement
}

export function Dropdown({ emptyText, ...props }: DropdownProps) {
  const { t } = useTranslation('common')
  return <AntDropdownAdapter {...props} emptyText={emptyText ?? t('dropdown.noMatches')} />
}

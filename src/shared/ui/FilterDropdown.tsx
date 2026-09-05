import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dropdown, IconFilter } from './primitives'

export type FilterDropdownProps = {
  children: ReactNode
  onApply?: () => void
  onReset?: () => void
  onOpenChange?: (open: boolean) => void
  placement?: 'bottom' | 'bottomLeft' | 'bottomRight'
  label?: ReactNode
  applyLabel?: ReactNode
  resetLabel?: ReactNode
}

/**
 * Shared advanced-filter disclosure. Feature code owns draft filter values and
 * URL synchronization; this component owns the consistent trigger and actions.
 */
export function FilterDropdown({
  children,
  onApply,
  onReset,
  onOpenChange,
  placement = 'bottomRight',
  label,
  applyLabel,
  resetLabel,
}: FilterDropdownProps) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const triggerLabel = label ?? t('filters.trigger')

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }

  return (
    <Dropdown
      open={open}
      onOpenChange={handleOpenChange}
      placement={placement}
      content={
        <div className="w-table-settings">
          <div className="app-scrollbar grid max-h-table-settings gap-4 overflow-y-auto p-4">
            {children}
          </div>
          <div className="flex gap-3 border-t border-border-subtle p-4">
            <Button className="flex-1" size="md" variant="secondary" onClick={onReset}>
              {resetLabel ?? t('filters.reset')}
            </Button>
            <Button
              className="flex-1"
              size="md"
              variant="primary"
              onClick={() => {
                onApply?.()
                handleOpenChange(false)
              }}
            >
              {applyLabel ?? t('filters.apply')}
            </Button>
          </div>
        </div>
      }
    >
      <Button size="md" variant="secondary" icon={<IconFilter />} aria-label={String(triggerLabel)}>
        {triggerLabel}
      </Button>
    </Dropdown>
  )
}

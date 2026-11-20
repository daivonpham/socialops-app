import type { ReactNode } from 'react'
import { Avatar, Button, Dropdown, IconCaretUpDown, IconPlus } from '../primitives'

export type SwitcherAccount = { id: string; name: string; avatarUrl?: string }

function AccountLabel({
  account,
  className = '',
}: {
  account: SwitcherAccount
  className?: string
}) {
  return (
    <span className={`flex min-w-0 items-center gap-2 ${className}`}>
      <Avatar name={account.name} src={account.avatarUrl} size="xs" />
      <span className="min-w-0 flex-1 truncate text-start">{account.name}</span>
    </span>
  )
}

/** "All accounts" or one of them, with an action to connect another at the bottom. */
export function AccountSwitcher({
  accounts,
  selectedId,
  allLabel,
  platformIcon,
  searchPlaceholder,
  ariaLabel,
  addLabel,
  onChange,
  onAdd,
}: {
  accounts: SwitcherAccount[]
  selectedId: string
  allLabel: string
  platformIcon: ReactNode
  searchPlaceholder: string
  ariaLabel: string
  /** Shown only when the user may connect accounts. */
  addLabel?: string
  onChange: (id: string) => void
  onAdd?: () => void
}) {
  const selected = accounts.find((account) => account.id === selectedId)

  return (
    <Dropdown
      searchPlaceholder={searchPlaceholder}
      items={[
        { key: 'all', label: allLabel, icon: platformIcon },
        { type: 'divider' },
        ...accounts.map((account) => ({
          key: account.id,
          label: <AccountLabel account={account} />,
          searchText: account.name,
        })),
      ]}
      selectedKey={selectedId}
      onSelect={(key) => {
        if (key !== selectedId) onChange(key)
      }}
      footer={
        addLabel && onAdd ? { label: addLabel, icon: <IconPlus />, onClick: onAdd } : undefined
      }
    >
      <Button size="md" variant="secondary" aria-label={ariaLabel} className="min-w-56">
        <span className="flex w-full min-w-0 items-center gap-2">
          {selected ? (
            <AccountLabel account={selected} className="flex-1" />
          ) : (
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="flex shrink-0">{platformIcon}</span>
              <span className="truncate text-start">{allLabel}</span>
            </span>
          )}
          <IconCaretUpDown aria-hidden className="shrink-0 text-icon-sm text-text-tertiary" />
        </span>
      </Button>
    </Dropdown>
  )
}

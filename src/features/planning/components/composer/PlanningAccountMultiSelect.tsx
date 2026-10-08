import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SocialAccountLabel } from '@/features/social-accounts'
import { Avatar, Button, Checkbox, IconChevronDown, IconCloseCompact, Popover } from '@/shared/ui'
import type { PlanningAccount } from '../../model'

export function PlanningAccountMultiSelect({
  accounts,
  selectedIds,
  onChange,
}: {
  accounts: PlanningAccount[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
}) {
  const { t } = useTranslation('planning')
  const selectedAccounts = accounts.filter((account) => selectedIds.includes(account.id))
  const onlyAccountId = accounts.length === 1 ? accounts[0].id : undefined
  const selectionChangedByUser = useRef(false)

  useEffect(() => {
    if (onlyAccountId && !selectedIds.includes(onlyAccountId) && !selectionChangedByUser.current) {
      onChange([onlyAccountId])
    }
  }, [onlyAccountId, onChange, selectedIds])

  const toggleAccount = (accountId: string, checked: boolean) => {
    selectionChangedByUser.current = true
    onChange(
      checked
        ? [...selectedIds, accountId]
        : selectedIds.filter((selectedId) => selectedId !== accountId),
    )
  }

  return (
    <Popover
      placement="bottomLeft"
      content={
        <div className="w-80 max-w-full p-2">
          <div className="app-scrollbar mt-1 grid max-h-64 gap-1 overflow-y-auto">
            {accounts.map((account) => (
              <label
                key={account.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-bg-surface-muted"
              >
                <Checkbox
                  checked={selectedIds.includes(account.id)}
                  onChange={(event) => toggleAccount(account.id, event.target.checked)}
                />
                <SocialAccountLabel
                  name={account.name}
                  avatarUrl={account.avatarUrl}
                  className="flex-1 text-body-sm text-text-primary"
                />
              </label>
            ))}
          </div>
        </div>
      }
    >
      <Button variant="secondary" className="h-auto min-h-10 w-full justify-start px-3 py-2">
        <span className="flex w-full min-w-0 items-center gap-2">
          <ResponsiveAccountSummary
            accounts={selectedAccounts}
            placeholder={t('composer.accounts.placeholder')}
            onRemove={(accountId) => toggleAccount(accountId, false)}
            removeLabel={(name) => t('composer.accounts.remove', { name })}
          />
          <IconChevronDown aria-hidden className="shrink-0 text-icon-sm text-text-tertiary" />
        </span>
      </Button>
    </Popover>
  )
}

function ResponsiveAccountSummary({
  accounts,
  placeholder,
  onRemove,
  removeLabel,
}: {
  accounts: PlanningAccount[]
  placeholder: string
  onRemove: (accountId: string) => void
  removeLabel: (name: string) => string
}) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const measurementRef = useRef<HTMLSpanElement>(null)
  const [visibleCount, setVisibleCount] = useState(accounts.length)
  const measurementKey = accounts
    .map((account) => `${account.id}:${account.name}:${account.avatarUrl ?? ''}`)
    .join('|')

  useLayoutEffect(() => {
    const container = containerRef.current
    const measurement = measurementRef.current
    if (!container || !measurement) return

    const updateVisibleCount = () => {
      if (accounts.length === 0) {
        setVisibleCount(0)
        return
      }

      const chipWidths = Array.from(
        measurement.querySelectorAll<HTMLElement>('[data-account-chip]'),
        (chip) => chip.getBoundingClientRect().width,
      )
      const counterWidth =
        measurement.querySelector<HTMLElement>('[data-account-counter]')?.getBoundingClientRect()
          .width ?? 0
      const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0
      const availableWidth = container.clientWidth
      const allChipsWidth =
        chipWidths.reduce((total, width) => total + width, 0) +
        gap * Math.max(chipWidths.length - 1, 0)

      if (allChipsWidth <= availableWidth) {
        setVisibleCount((current) => (current === accounts.length ? current : accounts.length))
        return
      }

      let occupiedWidth = 0
      let nextVisibleCount = 0

      for (const chipWidth of chipWidths) {
        const chipGap = nextVisibleCount > 0 ? gap : 0
        const counterGap = nextVisibleCount >= 0 ? gap : 0
        if (occupiedWidth + chipGap + chipWidth + counterGap + counterWidth > availableWidth) {
          break
        }
        occupiedWidth += chipGap + chipWidth
        nextVisibleCount += 1
      }

      setVisibleCount((current) => (current === nextVisibleCount ? current : nextVisibleCount))
    }

    updateVisibleCount()
    const observer = new ResizeObserver(updateVisibleCount)
    observer.observe(container)
    return () => observer.disconnect()
  }, [accounts.length, measurementKey])

  const visibleAccounts = accounts.slice(0, visibleCount)
  const hiddenCount = accounts.length - visibleAccounts.length

  return (
    <span
      ref={containerRef}
      className="relative flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
    >
      {accounts.length > 0 ? (
        <>
          {visibleAccounts.map((account) => (
            <AccountChip
              key={account.id}
              account={account}
              onRemove={onRemove}
              removeLabel={removeLabel(account.name)}
            />
          ))}
          {hiddenCount > 0 ? <AccountCounter count={hiddenCount} /> : null}
          <span ref={measurementRef} className="invisible absolute flex items-center gap-2">
            {accounts.map((account) => (
              <AccountChip key={account.id} account={account} measure />
            ))}
            <AccountCounter count={accounts.length} measure />
          </span>
        </>
      ) : (
        <span className="truncate text-start text-body-sm text-text-tertiary">{placeholder}</span>
      )}
    </span>
  )
}

function AccountChip({
  account,
  measure = false,
  onRemove,
  removeLabel,
}: {
  account: PlanningAccount
  measure?: boolean
  onRemove?: (accountId: string) => void
  removeLabel?: string
}) {
  return (
    <span
      data-account-chip={measure ? '' : undefined}
      className="flex min-w-0 max-w-48 shrink-0 items-center gap-2 rounded-pill bg-bg-surface-muted px-2 py-1"
    >
      <Avatar name={account.name} src={account.avatarUrl} size="xs" />
      <span className="truncate text-body-sm text-text-primary">{account.name}</span>
      {measure ? (
        <span className="flex size-5 shrink-0 items-center justify-center">
          <IconCloseCompact aria-hidden className="size-3.5" />
        </span>
      ) : (
        <span
          role="button"
          tabIndex={0}
          aria-label={removeLabel}
          title={removeLabel}
          className="flex size-5 shrink-0 items-center justify-center rounded-full text-text-tertiary hover:bg-bg-surface hover:text-text-primary focus-visible:focus-ring"
          onClick={(event) => {
            event.stopPropagation()
            onRemove?.(account.id)
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            event.stopPropagation()
            onRemove?.(account.id)
          }}
        >
          <IconCloseCompact aria-hidden className="size-3.5" />
        </span>
      )}
    </span>
  )
}

function AccountCounter({ count, measure = false }: { count: number; measure?: boolean }) {
  return (
    <span
      data-account-counter={measure ? '' : undefined}
      className="shrink-0 rounded-pill bg-bg-surface-muted px-2 py-1 text-caption text-text-secondary"
    >
      +{count}
    </span>
  )
}

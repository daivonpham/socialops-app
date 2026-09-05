import { Dropdown as AntDropdown, Input } from 'antd'
import type { MenuProps } from 'antd'
import {
  cloneElement,
  isValidElement,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import type { DropdownMenuItem, DropdownProps } from '@/shared/ui/primitives/Dropdown'
import { IconCheck, IconSearch } from './icons'

function matchesQuery(item: DropdownMenuItem, query: string): boolean {
  if ('type' in item) return query.length === 0
  if (query.length === 0) return true
  const searchableText = item.searchText ?? (typeof item.label === 'string' ? item.label : '')
  return searchableText.toLowerCase().includes(query.toLowerCase())
}

function toMenuItems(
  items: DropdownMenuItem[],
  selectedKey?: string,
): NonNullable<MenuProps['items']> {
  return items.map((item, index) => {
    if ('type' in item) return { type: 'divider' as const, key: `divider-${index}` }

    const selected = item.key === selectedKey
    return {
      key: item.key,
      disabled: item.disabled,
      danger: item.danger,
      icon: item.icon,
      label: <span className="text-body-sm">{item.label}</span>,
      extra: selected ? (
        <IconCheck aria-hidden className="text-icon-sm text-text-tertiary" />
      ) : undefined,
    }
  })
}

function caretPosition(placement: NonNullable<DropdownProps['placement']>): string {
  if (placement === 'bottomLeft') return 'left-4 -translate-y-1/2'
  if (placement === 'bottomRight') return 'right-4 -translate-y-1/2'
  return 'left-1/2 -translate-x-1/2 -translate-y-1/2'
}

/**
 * Outlined caret that continues the panel border — Ant's filled arrow cannot
 * do this. Rotated square sits on the top edge so the stroke is one line.
 */
function DropdownCaret({ placement }: { placement: NonNullable<DropdownProps['placement']> }) {
  return (
    <span
      aria-hidden
      className={
        'pointer-events-none absolute top-0 size-3 rotate-45 rounded-xs border-l border-t border-border-subtle bg-bg-surface ' +
        caretPosition(placement)
      }
    />
  )
}

function DropdownSurface({
  placement,
  className = '',
  children,
}: {
  placement: NonNullable<DropdownProps['placement']>
  className?: string
  children: ReactNode
}) {
  return (
    <div className="pt-2">
      <div
        className={`${className} relative rounded-lg border border-border-subtle bg-bg-surface shadow-lg`}
      >
        <DropdownCaret placement={placement} />
        {children}
      </div>
    </div>
  )
}

export function Dropdown({
  items,
  content,
  selectedKey,
  onSelect,
  placement = 'bottom',
  open: controlledOpen,
  onOpenChange,
  searchPlaceholder,
  emptyText,
  footer,
  children,
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const open = controlledOpen ?? internalOpen
  const hasChrome = !content && Boolean(searchPlaceholder || footer)

  const visibleItems = (items ?? []).filter((item) => matchesQuery(item, query))
  const menuItems: MenuProps['items'] =
    visibleItems.length === 0
      ? [
          {
            key: '__empty',
            disabled: true,
            label: <span className="text-body-sm text-text-tertiary">{emptyText}</span>,
          },
        ]
      : toMenuItems(visibleItems, selectedKey)

  const setOpen = (next: boolean) => {
    setInternalOpen(next)
    onOpenChange?.(next)
    if (!next) setQuery('')
  }

  const close = () => setOpen(false)

  return (
    <AntDropdown
      trigger={['click']}
      placement={placement}
      open={open}
      onOpenChange={setOpen}
      menu={
        content
          ? undefined
          : {
              items: menuItems,
              selectable: Boolean(selectedKey),
              selectedKeys: selectedKey ? [selectedKey] : [],
              onClick: ({ key }) => {
                if (key === '__empty') return
                onSelect?.(key)
              },
            }
      }
      popupRender={(menu) => (
        <DropdownSurface
          placement={placement}
          className={content ? '' : hasChrome ? 'w-sidebar' : ''}
        >
          {content ?? (
            <>
              {searchPlaceholder ? (
                <>
                  <div className="px-1 py-1">
                    <Input
                      allowClear
                      variant="borderless"
                      size="small"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={searchPlaceholder}
                      autoComplete="off"
                      spellCheck={false}
                      prefix={
                        <IconSearch aria-hidden className="text-icon-sm text-text-tertiary" />
                      }
                      className="text-body-sm"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    />
                  </div>
                  <div className="h-px bg-border-subtle" />
                </>
              ) : null}

              <div className={hasChrome ? 'app-scrollbar max-h-64 overflow-y-auto' : undefined}>
                {isValidElement(menu)
                  ? cloneElement(menu as ReactElement<{ style?: CSSProperties }>, {
                      style: { boxShadow: 'none', background: 'transparent' },
                    })
                  : menu}
              </div>

              {footer ? (
                <>
                  <div className="h-px bg-border-subtle" />
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        footer.onClick?.()
                        close()
                      }}
                      className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-body-sm text-text-secondary outline-none transition-colors duration-base ease-standard hover:bg-bg-surface-muted hover:text-text-primary focus-visible:focus-ring"
                    >
                      {footer.icon ? (
                        <span aria-hidden className="flex text-icon-sm">
                          {footer.icon}
                        </span>
                      ) : null}
                      <span className="min-w-0 truncate">{footer.label}</span>
                    </button>
                  </div>
                </>
              ) : null}
            </>
          )}
        </DropdownSurface>
      )}
    >
      {children}
    </AntDropdown>
  )
}

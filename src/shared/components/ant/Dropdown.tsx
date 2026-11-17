import { Dropdown as AntDropdown, Input } from 'antd'
import type { MenuProps } from 'antd'
import {
  cloneElement,
  isValidElement,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react'
import { matchesSearch } from '@/shared/lib/search'
import type { DropdownMenuItem, DropdownProps } from '@/shared/ui/primitives/Dropdown'
import { IconCheck, IconSearch } from './icons'
import { PopupSurface } from './PopupSurface'

function matchesQuery(item: DropdownMenuItem, query: string): boolean {
  if ('type' in item) return query.length === 0
  if (query.length === 0) return true
  const searchableText = item.searchText ?? (typeof item.label === 'string' ? item.label : '')
  return matchesSearch(searchableText, query)
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
      extra:
        (selected && item.showSelectedIndicator !== false) || item.action ? (
          <span className="flex items-center gap-1">
            {selected && item.showSelectedIndicator !== false ? (
              <IconCheck aria-hidden className="text-icon-sm text-text-tertiary" />
            ) : null}
            {item.action ? (
              <button
                type="button"
                aria-label={item.action.label}
                title={item.action.label}
                className="flex size-7 items-center justify-center rounded-md text-text-tertiary outline-none hover:bg-bg-surface-muted hover:text-text-primary focus-visible:focus-ring"
                onClick={(event) => {
                  event.stopPropagation()
                  item.action?.onClick()
                }}
              >
                {item.action.icon}
              </button>
            ) : null}
          </span>
        ) : undefined,
    }
  })
}

export function Dropdown({
  items,
  content,
  selectedKey,
  onSelect,
  placement = 'bottom',
  open: controlledOpen,
  onOpenChange,
  getPopupContainer,
  popupClassName,
  onPopupMouseEnter,
  onPopupMouseLeave,
  searchPlaceholder,
  emptyText,
  footer,
  caret = true,
  highlightTrigger = true,
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
  const triggerElement = children as ReactElement<{ className?: string }>
  const trigger = cloneElement(triggerElement, {
    className:
      `${triggerElement.props.className ?? ''} ${open && highlightTrigger ? 'control-active' : ''}`.trim(),
  })

  return (
    <AntDropdown
      trigger={['click']}
      placement={placement}
      open={open}
      onOpenChange={setOpen}
      getPopupContainer={getPopupContainer}
      overlayClassName={popupClassName}
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
        <PopupSurface
          placement={placement}
          caret={caret}
          onMouseEnter={onPopupMouseEnter}
          onMouseLeave={onPopupMouseLeave}
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
                  <div className="flex items-center gap-1 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        footer.onClick?.()
                        close()
                      }}
                      className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg px-3 text-start text-body-sm text-text-secondary outline-none transition-colors duration-base ease-standard hover:bg-bg-surface-muted hover:text-text-primary focus-visible:focus-ring"
                    >
                      {footer.icon ? (
                        <span aria-hidden className="flex text-icon-sm">
                          {footer.icon}
                        </span>
                      ) : null}
                      <span className="min-w-0 truncate">{footer.label}</span>
                    </button>
                    {footer.trailingAction ? (
                      <button
                        type="button"
                        aria-label={footer.trailingAction.label}
                        title={footer.trailingAction.label}
                        onClick={() => {
                          footer.trailingAction?.onClick()
                          close()
                        }}
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-text-tertiary outline-none transition-colors duration-base ease-standard hover:bg-bg-surface-muted hover:text-text-primary focus-visible:focus-ring"
                      >
                        <span aria-hidden className="flex text-icon-sm">
                          {footer.trailingAction.icon}
                        </span>
                      </button>
                    ) : null}
                  </div>
                </>
              ) : null}
            </>
          )}
        </PopupSurface>
      )}
    >
      {trigger}
    </AntDropdown>
  )
}

import { useState } from 'react'
import { Select as AntSelect } from 'antd'
import type { SelectProps } from '@/shared/ui/primitives/Select'

export function Select({
  label,
  id,
  options,
  showSearch = true,
  onChange,
  footerAction,
  ...props
}: SelectProps) {
  // Opening a dialog from the footer must close the list first.
  const [open, setOpen] = useState(false)
  const control = (
    <AntSelect
      id={id}
      options={options.map((option) => ({
        ...option,
        searchText:
          option.searchText ?? (typeof option.label === 'string' ? option.label : option.value),
      }))}
      showSearch={showSearch}
      optionFilterProp="searchText"
      popupMatchSelectWidth={false}
      onChange={(value) => onChange?.({ target: { value } })}
      {...(footerAction
        ? {
            open,
            onOpenChange: setOpen,
            popupRender: (menu) => (
              <>
                {menu}
                <div className="mt-1 border-t border-border-subtle pt-1">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-start text-body-sm text-text-secondary outline-none transition-colors duration-fast hover:bg-bg-surface-subtle hover:text-text-primary focus-visible:focus-ring"
                    // Keep focus on the select so the click is not lost when the list closes.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setOpen(false)
                      footerAction.onClick()
                    }}
                  >
                    <span>{footerAction.label}</span>
                    {footerAction.icon ? (
                      <span className="flex shrink-0 text-icon-sm text-text-tertiary">
                        {footerAction.icon}
                      </span>
                    ) : null}
                  </button>
                </div>
              </>
            ),
          }
        : {})}
      {...props}
      className={`min-w-40 ${props.className ?? ''}`}
    />
  )
  if (!label) return control
  return (
    <label className="grid gap-1.5 text-label-md text-text-secondary" htmlFor={id}>
      <span>{label}</span>
      {control}
    </label>
  )
}

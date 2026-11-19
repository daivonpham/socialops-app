import { Segmented, Tabs as AntTabs } from 'antd'
import { componentToken } from '@/shared/styles/tokens'
import type { TabsProps } from '@/shared/ui/primitives/Tabs'

export function Tabs<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  variant = 'solid',
  className,
  block = false,
}: TabsProps<T>) {
  if (variant === 'solid') {
    return (
      <div aria-label={ariaLabel} role="tablist" className={className}>
        <Segmented
          size="middle"
          value={value}
          block={block}
          className="font-medium"
          style={{ boxShadow: componentToken.tabs.solidTrackOutline }}
          options={options.map((option) => ({
            value: option.value,
            label: option.label,
            disabled: option.disabled,
          }))}
          onChange={(key) => onChange(key as T)}
        />
      </div>
    )
  }

  if (variant === 'transparent') {
    return (
      <div aria-label={ariaLabel} role="tablist" className="flex flex-col items-center gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={value === option.value}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center rounded-md p-1.5 transition-[background-color,color,opacity] duration-fast hover:bg-bg-surface-muted focus-visible:focus-ring disabled:opacity-50 ${value === option.value ? 'text-action-text' : 'text-text-tertiary opacity-60 hover:text-text-primary hover:opacity-100'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <AntTabs
      activeKey={value}
      items={options.map((option) => ({
        key: option.value,
        label: option.label,
        disabled: option.disabled,
      }))}
      onChange={(key) => onChange(key as T)}
      tabBarGutter={24}
      aria-label={ariaLabel}
    />
  )
}

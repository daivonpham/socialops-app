import { Segmented, Tabs as AntTabs } from 'antd'
import { componentToken } from '@/shared/styles/tokens'
import type { TabsProps } from '@/shared/ui/primitives/Tabs'

export function Tabs<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  variant = 'solid',
}: TabsProps<T>) {
  if (variant === 'solid') {
    return (
      <div aria-label={ariaLabel} role="tablist">
        <Segmented
          size="middle"
          value={value}
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

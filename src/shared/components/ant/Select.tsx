import { Select as AntSelect } from 'antd'
import type { SelectProps } from '@/shared/ui/primitives/Select'

export function Select({ label, id, options, showSearch = true, onChange, ...props }: SelectProps) {
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

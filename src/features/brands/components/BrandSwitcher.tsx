import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'
import { Avatar, Button, Dropdown, IconCaretUpDown, Spin } from '@/shared/ui'
import { useBrands } from '../api'

export function BrandSwitcher() {
  const { workspaceId } = useActiveWorkspace()
  const { brandId, selectBrand } = useActiveBrand()
  const { data: brands, isPending } = useBrands(workspaceId)

  if (isPending) return <Spin size="sm" />

  const current = brands?.find((brand) => brand.id === brandId)

  return (
    <Dropdown
      items={(brands ?? []).map((brand) => ({
        key: brand.id,
        label: brand.name,
        icon: <Avatar name={brand.name} size="xs" />,
      }))}
      selectedKey={brandId ?? undefined}
      onSelect={(key) => {
        if (workspaceId !== null && key !== brandId) selectBrand(workspaceId, key)
      }}
    >
      <Button variant="ghost" size="sm" aria-label="Switch brand" className="min-w-0 px-1.5">
        <span className="flex min-w-0 items-center gap-2">
          {current ? <Avatar name={current.name} size="xs" /> : null}
          <span className="truncate text-body-sm text-text-secondary">
            {current?.name ?? 'Select brand'}
          </span>
          <IconCaretUpDown aria-hidden className="text-icon-sm text-text-tertiary" />
        </span>
      </Button>
    </Dropdown>
  )
}

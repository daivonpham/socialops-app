import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'
import {
  Avatar,
  Button,
  Dropdown,
  IconCaretUpDown,
  IconPlus,
  IconSettingsOutline,
  Spin,
} from '@/shared/ui'
import { useBrands } from '../api'
import { useWorkspaces } from '@/features/workspaces'
import { CreateBrandModal } from './CreateBrandModal'
import { ManageBrandsModal } from './ManageBrandsModal'

export function BrandSwitcher() {
  const { t } = useTranslation('brands')
  const { workspaceId } = useActiveWorkspace()
  const { brandId, selectBrand } = useActiveBrand()
  const { data: brands, isPending } = useBrands(workspaceId)
  const { data: workspaces } = useWorkspaces()
  const [createOpen, setCreateOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)

  if (isPending) return <Spin size="sm" />

  const current = brands?.find((brand) => brand.id === brandId)
  const workspaceRole = workspaces?.find((workspace) => workspace.id === workspaceId)?.role
  // Creating and deleting Brands is Workspace management (Owner, Full access); an Admin only
  // edits the Brands they are assigned.
  const canManageBrands = workspaceRole === 'owner' || workspaceRole === 'full_access'
  const canEditBrands = canManageBrands || workspaceRole === 'admin'
  const manageAction = {
    label: t('switcher.manage'),
    icon: <IconSettingsOutline />,
    onClick: () => setManageOpen(true),
  }

  return (
    <>
      <Dropdown
        searchPlaceholder={t('switcher.searchPlaceholder')}
        items={(brands ?? []).map((brand) => ({
          key: brand.id,
          label: brand.name,
          searchText: brand.name,
          icon: (
            <Avatar
              name={brand.name}
              src={brand.avatarUrl ?? undefined}
              size="xs"
              fallbackClassName="inline-flex items-center justify-center align-middle text-label-sm leading-none"
            />
          ),
        }))}
        selectedKey={brandId ?? undefined}
        onSelect={(key) => {
          if (workspaceId !== null && key !== brandId) selectBrand(workspaceId, key)
        }}
        footer={
          canManageBrands
            ? {
                label: t('switcher.create'),
                icon: <IconPlus />,
                onClick: () => setCreateOpen(true),
                trailingAction: manageAction,
              }
            : canEditBrands
              ? manageAction
              : undefined
        }
      >
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('switcher.ariaLabel')}
          className="min-w-0 px-1.5"
        >
          <span className="flex min-w-0 items-center gap-2">
            {current ? (
              <Avatar
                name={current.name}
                src={current.avatarUrl ?? undefined}
                size="xs"
                fallbackClassName="inline-flex items-center justify-center align-middle text-label-sm leading-none"
              />
            ) : null}
            <span className="truncate text-body-sm text-text-secondary">
              {current?.name ?? t('switcher.selectPlaceholder')}
            </span>
            <IconCaretUpDown aria-hidden className="text-icon-sm text-text-tertiary" />
          </span>
        </Button>
      </Dropdown>
      <CreateBrandModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ManageBrandsModal
        open={manageOpen}
        canCreateAndDelete={canManageBrands}
        onClose={() => setManageOpen(false)}
      />
    </>
  )
}

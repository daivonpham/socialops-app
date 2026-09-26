import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'
import { getBrands } from '@/features/brands/api/service'
import {
  Button,
  Dropdown,
  IconCaretUpDown,
  IconPlus,
  IconSettingsOutline,
  Spin,
} from '@/shared/ui'
import { useWorkspaces } from '../api'
import { CreateWorkspaceModal } from './CreateWorkspaceModal'
import { ManageWorkspacesModal } from './ManageWorkspacesModal'

export function WorkspaceSwitcher() {
  const { t } = useTranslation('workspaces')
  const { workspaceId, setWorkspace } = useActiveWorkspace()
  const { selectBrand } = useActiveBrand()
  const { data: workspaces, isPending } = useWorkspaces()
  const [createOpen, setCreateOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)

  if (isPending) return <Spin size="sm" />

  const current = workspaces?.find((workspace) => workspace.id === workspaceId)

  const selectWorkspace = async (nextWorkspaceId: string) => {
    try {
      const response = await getBrands(nextWorkspaceId)
      const firstBrand = response.data[0]
      if (firstBrand) selectBrand(nextWorkspaceId, firstBrand.id)
      else setWorkspace(nextWorkspaceId)
    } catch {
      setWorkspace(nextWorkspaceId)
    }
  }

  return (
    <>
      <Dropdown
        searchPlaceholder={t('switcher.searchPlaceholder')}
        items={(workspaces ?? []).map((workspace) => ({
          key: workspace.id,
          label: workspace.name,
        }))}
        selectedKey={workspaceId ?? undefined}
        onSelect={(key) => {
          if (key !== workspaceId) void selectWorkspace(key)
        }}
        footer={{
          label: t('switcher.create'),
          icon: <IconPlus />,
          onClick: () => setCreateOpen(true),
          trailingAction: {
            label: t('switcher.manage'),
            icon: <IconSettingsOutline />,
            onClick: () => setManageOpen(true),
          },
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('switcher.ariaLabel')}
          className="w-full min-w-0 px-1.5"
        >
          <span className="flex w-full min-w-0 items-center justify-between gap-2">
            <span className="truncate text-body-sm text-text-secondary">
              {current?.name ?? t('switcher.selectPlaceholder')}
            </span>
            <IconCaretUpDown aria-hidden className="text-icon-sm text-text-tertiary" />
          </span>
        </Button>
      </Dropdown>
      <CreateWorkspaceModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ManageWorkspacesModal open={manageOpen} onClose={() => setManageOpen(false)} />
    </>
  )
}

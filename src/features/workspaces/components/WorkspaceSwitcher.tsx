import { useActiveWorkspace } from '@/shared/scope'
import { Button, Dropdown, IconCaretUpDown, IconPlus, Spin } from '@/shared/ui'
import { useWorkspaces } from '../api'

export function WorkspaceSwitcher() {
  const { t } = useTranslation('workspaces')
  const { workspaceId, setWorkspace } = useActiveWorkspace()
  const { data: workspaces, isPending } = useWorkspaces()

  if (isPending) return <Spin size="sm" />

  const current = workspaces?.find((workspace) => workspace.id === workspaceId)

  return (
    <Dropdown
      searchPlaceholder={t('switcher.searchPlaceholder')}
      items={(workspaces ?? []).map((workspace) => ({
        key: workspace.id,
        label: workspace.name,
      }))}
      selectedKey={workspaceId ?? undefined}
      onSelect={(key) => {
        // Changing workspace clears the brand; the brand guard then routes to the picker.
        if (key !== workspaceId) setWorkspace(key)
      }}
      footer={{
        label: t('switcher.create'),
        icon: <IconPlus />,
      }}
    >
      <Button variant="ghost" size="sm" aria-label={t('switcher.ariaLabel')} className="w-full min-w-0 px-1.5">
        <span className="flex w-full min-w-0 items-center justify-between gap-2">
          <span className="truncate text-body-sm text-text-secondary">
            {current?.name ?? t('switcher.selectPlaceholder')}
          </span>
          <IconCaretUpDown aria-hidden className="text-icon-sm text-text-tertiary" />
        </span>
      </Button>
    </Dropdown>
  )
}
import { useTranslation } from 'react-i18next'

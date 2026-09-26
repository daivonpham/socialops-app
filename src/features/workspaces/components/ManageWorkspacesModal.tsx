import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getBrands } from '@/features/brands/api/service'
import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'
import {
  Alert,
  Button,
  IconDelete,
  IconEdit,
  IconPlus,
  IconWorkspaces,
  Input,
  Modal,
  Spin,
  useToast,
} from '@/shared/ui'
import {
  WORKSPACE_QUERY_KEYS,
  type WorkspaceDto,
  useDeleteWorkspace,
  useWorkspaces,
} from '../api'
import { CreateWorkspaceModal } from './CreateWorkspaceModal'
import { EditWorkspaceModal } from './EditWorkspaceModal'

export function ManageWorkspacesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('workspaces')
  const queryClient = useQueryClient()
  const toast = useToast()
  const { workspaceId, setWorkspace } = useActiveWorkspace()
  const { selectBrand } = useActiveBrand()
  const { data: workspaces, isPending } = useWorkspaces()
  const removeWorkspace = useDeleteWorkspace()
  const [createOpen, setCreateOpen] = useState(false)
  const [editWorkspace, setEditWorkspace] = useState<WorkspaceDto | null>(null)
  const [workspaceToDelete, setWorkspaceToDelete] = useState<WorkspaceDto | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const close = () => {
    if (removeWorkspace.isPending) return
    onClose()
  }

  const confirmDelete = async () => {
    if (!workspaceToDelete) return
    try {
      await removeWorkspace.mutateAsync(workspaceToDelete.id)
    } catch {
      toast.error({ title: t('toast.deleteError') })
      return
    }
    const remaining = (workspaces ?? []).filter((item) => item.id !== workspaceToDelete.id)
    await queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEYS.list() })
    if (workspaceId === workspaceToDelete.id) {
      const nextWorkspace = remaining[0]
      if (!nextWorkspace) {
        setWorkspace(null)
      } else {
        try {
          const response = await getBrands(nextWorkspace.id)
          const firstBrand = response.data[0]
          if (firstBrand) selectBrand(nextWorkspace.id, firstBrand.id)
          else setWorkspace(nextWorkspace.id)
        } catch {
          setWorkspace(nextWorkspace.id)
        }
      }
    }
    setDeleteConfirmation('')
    setWorkspaceToDelete(null)
    toast.success({ title: t('toast.deleteSuccess') })
  }

  return (
    <>
      <Modal
        open={open}
        title={t('manageModal.title')}
        headerIcon={<IconWorkspaces aria-hidden />}
        headerDescription={t('manageModal.description')}
        width={620}
        floatingClose
        onClose={close}
        footer={null}
      >
        <div className="mb-4 flex justify-end">
          <Button icon={<IconPlus />} onClick={() => setCreateOpen(true)}>
            {t('manageModal.create')}
          </Button>
        </div>

        {isPending ? (
          <div className="flex justify-center py-10">
            <Spin size="lg" />
          </div>
        ) : (
          <div className="grid gap-2">
            {(workspaces ?? []).map((workspace) => {
              const canEdit = workspace.role === 'owner' || workspace.role === 'admin'
              const canDelete = workspace.role === 'owner'
              return (
                <div
                  key={workspace.id}
                  className="flex min-w-0 items-center gap-3 rounded-lg border border-border-subtle px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label-md text-text-primary">{workspace.name}</p>
                    <p className="mt-0.5 text-caption uppercase text-text-tertiary">
                      {t(`roles.${workspace.role}`)}
                    </p>
                  </div>
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<IconEdit />}
                      aria-label={t('manageModal.edit', { name: workspace.name })}
                      title={t('manageModal.edit', { name: workspace.name })}
                      onClick={() => setEditWorkspace(workspace)}
                    />
                  ) : null}
                  {canDelete ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<IconDelete />}
                      aria-label={t('manageModal.delete', { name: workspace.name })}
                      title={t('manageModal.delete', { name: workspace.name })}
                      onClick={() => {
                        removeWorkspace.reset()
                        setDeleteConfirmation('')
                        setWorkspaceToDelete(workspace)
                      }}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </Modal>

      <CreateWorkspaceModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditWorkspaceModal
        workspace={editWorkspace}
        open={editWorkspace !== null}
        onClose={() => setEditWorkspace(null)}
      />
      <Modal
        open={workspaceToDelete !== null}
        title={t('deleteModal.title')}
        headerIcon={<IconDelete aria-hidden className="text-error-700" />}
        headerDescription={t('deleteModal.description', {
          name: workspaceToDelete?.name ?? '',
        })}
        headerLayout="vertical"
        width={440}
        onClose={() => {
          if (removeWorkspace.isPending) return
          setDeleteConfirmation('')
          setWorkspaceToDelete(null)
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              disabled={removeWorkspace.isPending}
              onClick={() => {
                setDeleteConfirmation('')
                setWorkspaceToDelete(null)
              }}
            >
              {t('deleteModal.cancel')}
            </Button>
            <Button
              variant="destructive"
              loading={removeWorkspace.isPending}
              disabled={deleteConfirmation !== workspaceToDelete?.name}
              onClick={() => void confirmDelete()}
            >
              {t('deleteModal.confirm')}
            </Button>
          </div>
        }
      >
        <div>
          <Input
            value={deleteConfirmation}
            label={t('deleteModal.confirmationLabel', { name: workspaceToDelete?.name ?? '' })}
            placeholder={workspaceToDelete?.name ?? ''}
            autoComplete="off"
            disabled={removeWorkspace.isPending}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
          />
        </div>
        {removeWorkspace.isError ? (
          <div className="mt-4">
            <Alert variant="soft" tone="error" title={t('deleteModal.error')} />
          </div>
        ) : null}
      </Modal>
    </>
  )
}

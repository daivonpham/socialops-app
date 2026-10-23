import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'
import {
  Alert,
  Avatar,
  Button,
  ConfirmDialog,
  IconBrandManagement,
  IconDelete,
  IconEdit,
  IconPlus,
  Input,
  Modal,
  Spin,
  useToast,
} from '@/shared/ui'
import { BRAND_QUERY_KEYS, type BrandDto, useBrands, useDeleteBrand } from '../api'
import { CreateBrandModal } from './CreateBrandModal'
import { EditBrandModal } from './EditBrandModal'

export function ManageBrandsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('brands')
  const queryClient = useQueryClient()
  const toast = useToast()
  const { workspaceId, setWorkspace } = useActiveWorkspace()
  const { brandId, selectBrand } = useActiveBrand()
  const { data: brands, isPending } = useBrands(workspaceId)
  const removeBrand = useDeleteBrand()
  const [createOpen, setCreateOpen] = useState(false)
  const [editBrand, setEditBrand] = useState<BrandDto | null>(null)
  const [brandToDelete, setBrandToDelete] = useState<BrandDto | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const close = () => {
    if (removeBrand.isPending) return
    onClose()
  }

  const confirmDelete = async () => {
    if (!brandToDelete || !workspaceId) return
    try {
      await removeBrand.mutateAsync(brandToDelete.id)
    } catch {
      toast.error({ title: t('toast.deleteError') })
      return
    }

    const remaining = (brands ?? []).filter((item) => item.id !== brandToDelete.id)
    await queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.list(workspaceId) })
    queryClient.removeQueries({ queryKey: BRAND_QUERY_KEYS.detail(brandToDelete.id) })
    if (brandId === brandToDelete.id) {
      const nextBrand = remaining[0]
      if (nextBrand) selectBrand(workspaceId, nextBrand.id)
      else setWorkspace(workspaceId)
    }
    setDeleteConfirmation('')
    setBrandToDelete(null)
    toast.success({ title: t('toast.deleteSuccess') })
  }

  return (
    <>
      <Modal
        open={open}
        title={t('manageModal.title')}
        headerIcon={<IconBrandManagement aria-hidden />}
        headerDescription={t('manageModal.description')}
        width={620}
        floatingClose
        onClose={close}
        footer={null}
      >
        <div className="mb-4 flex justify-end">
          <Button
            icon={<IconPlus />}
            disabled={workspaceId === null}
            onClick={() => setCreateOpen(true)}
          >
            {t('manageModal.create')}
          </Button>
        </div>

        {isPending ? (
          <div className="flex justify-center py-10">
            <Spin size="lg" />
          </div>
        ) : (
          <div className="grid gap-2">
            {(brands ?? []).map((brand) => (
              <div
                key={brand.id}
                className="flex min-w-0 items-center gap-3 rounded-lg border border-border-subtle px-4 py-3"
              >
                <Avatar
                  name={brand.name}
                  src={brand.avatarUrl ?? undefined}
                  size="sm"
                  fallbackClassName="text-label-sm"
                />
                <p className="min-w-0 flex-1 truncate text-label-md text-text-primary">
                  {brand.name}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<IconEdit />}
                  aria-label={t('manageModal.edit', { name: brand.name })}
                  title={t('manageModal.edit', { name: brand.name })}
                  onClick={() => setEditBrand(brand)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<IconDelete />}
                  aria-label={t('manageModal.delete', { name: brand.name })}
                  title={t('manageModal.delete', { name: brand.name })}
                  onClick={() => {
                    removeBrand.reset()
                    setDeleteConfirmation('')
                    setBrandToDelete(brand)
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </Modal>

      <CreateBrandModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditBrandModal
        brand={editBrand}
        open={editBrand !== null}
        onClose={() => setEditBrand(null)}
      />
      <ConfirmDialog
        open={brandToDelete !== null}
        title={t('deleteModal.title')}
        description={t('deleteModal.description', { name: brandToDelete?.name ?? '' })}
        confirmLabel={t('deleteModal.confirm')}
        cancelLabel={t('deleteModal.cancel')}
        loading={removeBrand.isPending}
        confirmDisabled={deleteConfirmation !== brandToDelete?.name}
        onConfirm={() => void confirmDelete()}
        onClose={() => {
          setDeleteConfirmation('')
          setBrandToDelete(null)
        }}
      >
        <Input
          value={deleteConfirmation}
          label={t('deleteModal.confirmationLabel', { name: brandToDelete?.name ?? '' })}
          placeholder={brandToDelete?.name ?? ''}
          autoComplete="off"
          disabled={removeBrand.isPending}
          onChange={(event) => setDeleteConfirmation(event.target.value)}
        />
        {removeBrand.isError ? (
          <Alert variant="soft" tone="error" title={t('deleteModal.error')} />
        ) : null}
      </ConfirmDialog>
    </>
  )
}

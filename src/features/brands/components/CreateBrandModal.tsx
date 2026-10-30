import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/shared/ui'
import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'
import { BRAND_QUERY_KEYS, type BrandDto, useCreateBrand, useUploadBrandAvatar } from '../api'
import { BrandFormModal, type BrandFormSubmit } from './BrandFormModal'
import { useApiErrorMessage } from '@/shared/hooks'

export function CreateBrandModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('brands')
  const errorMessage = useApiErrorMessage('brands')
  const queryClient = useQueryClient()
  const toast = useToast()
  const { workspaceId } = useActiveWorkspace()
  const { selectBrand } = useActiveBrand()
  const createBrand = useCreateBrand()
  const uploadAvatar = useUploadBrandAvatar()
  const pending = createBrand.isPending || uploadAvatar.isPending

  const close = () => {
    if (pending) return
    createBrand.reset()
    uploadAvatar.reset()
    onClose()
  }

  const submit = async ({ name, avatar }: BrandFormSubmit) => {
    if (!workspaceId) return
    let brand: BrandDto
    try {
      brand = await createBrand.mutateAsync({
        workspaceId,
        name,
        slug: `${slugify(name)}-${crypto.randomUUID().slice(0, 6)}`,
      })
    } catch (error) {
      toast.error({ title: errorMessage(error, t('toast.createError')) })
      return
    }
    if (avatar) {
      try {
        await uploadAvatar.mutateAsync({ brandId: brand.id, avatar })
      } catch {
        // The optional avatar does not block the successfully created Brand.
      }
    }
    await queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.list(workspaceId) })
    selectBrand(workspaceId, brand.id)
    toast.success({ title: t('toast.createSuccess') })
    onClose()
  }

  return (
    <BrandFormModal
      mode="create"
      open={open}
      pending={pending}
      disabled={workspaceId === null}
      error={createBrand.error}
      onClose={close}
      onSubmit={submit}
    />
  )
}

function slugify(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'brand'
}

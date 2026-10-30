import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/shared/ui'
import { BRAND_QUERY_KEYS, type BrandDto, useUpdateBrand, useUploadBrandAvatar } from '../api'
import { BrandFormModal, type BrandFormSubmit } from './BrandFormModal'
import { useApiErrorMessage } from '@/shared/hooks'

export function EditBrandModal({
  brand,
  open,
  onClose,
}: {
  brand: BrandDto | null
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('brands')
  const errorMessage = useApiErrorMessage('brands')
  const queryClient = useQueryClient()
  const toast = useToast()
  const updateBrand = useUpdateBrand()
  const uploadAvatar = useUploadBrandAvatar()
  const pending = updateBrand.isPending || uploadAvatar.isPending

  const close = () => {
    if (pending) return
    updateBrand.reset()
    uploadAvatar.reset()
    onClose()
  }

  const submit = async ({ name, avatar }: BrandFormSubmit) => {
    if (!brand) return
    try {
      await updateBrand.mutateAsync({ brandId: brand.id, name })
      if (avatar) await uploadAvatar.mutateAsync({ brandId: brand.id, avatar })
    } catch (error) {
      toast.error({ title: errorMessage(error, t('toast.updateError')) })
      return
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.list(brand.workspaceId) }),
        queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.detail(brand.id) }),
      ])
    }
    toast.success({ title: t('toast.updateSuccess') })
    onClose()
  }

  return (
    <BrandFormModal
      mode="edit"
      open={open}
      initialName={brand?.name}
      avatarUrl={brand?.avatarUrl}
      pending={pending}
      disabled={!brand}
      error={updateBrand.error ?? uploadAvatar.error}
      onClose={close}
      onSubmit={submit}
    />
  )
}

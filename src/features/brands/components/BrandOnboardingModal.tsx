import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, Avatar, Button, Form, Input, Modal } from '@/shared/ui'
import { useAuth } from '@/shared/auth'
import { useActiveBrand } from '@/shared/scope'
import {
  BRAND_QUERY_KEYS,
  useCompleteBrandOnboarding,
  useCreateBrand,
  useUploadBrandAvatar,
} from '../api'

type BrandFormValues = { name: string }

export function BrandOnboardingModal({ workspaceId }: { workspaceId: string | null }) {
  const { t } = useTranslation('brands')
  const { user, updateUser } = useAuth()
  const { selectBrand } = useActiveBrand()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createBrand = useCreateBrand()
  const uploadAvatar = useUploadBrandAvatar()
  const completeOnboarding = useCompleteBrandOnboarding()
  const inputRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const open = user?.brandOnboardingCompleted === false
  const pending = createBrand.isPending || uploadAvatar.isPending || completeOnboarding.isPending

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  const markCompletedLocally = () => {
    if (user) updateUser({ ...user, brandOnboardingCompleted: true })
  }

  const skip = async () => {
    if (pending) return
    await completeOnboarding.mutateAsync()
    markCompletedLocally()
  }

  const chooseAvatar = (file?: File) => {
    setAvatarError(null)
    if (!file) return
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setAvatarError(t('onboarding.invalidAvatar'))
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAvatar(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const submit = async ({ name }: BrandFormValues) => {
    if (!workspaceId) return
    const trimmedName = name.trim()
    const slug = `${slugify(trimmedName)}-${crypto.randomUUID().slice(0, 6)}`
    const brand = await createBrand.mutateAsync({ workspaceId, name: trimmedName, slug })
    if (avatar) {
      try {
        await uploadAvatar.mutateAsync({ brandId: brand.id, avatar })
      } catch {
        // The Brand is usable even if its optional image could not be uploaded.
      }
    }
    markCompletedLocally()
    await queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.list(workspaceId) })
    selectBrand(workspaceId, brand.id)
    navigate('/', { replace: true })
  }

  return (
    <Modal
      open={open}
      title={t('onboarding.title')}
      width={480}
      blurBackdrop
      onClose={() => void skip()}
      footer={null}
    >
      <p className="mb-6 text-body-sm text-text-secondary">{t('onboarding.description')}</p>
      <Form<BrandFormValues> layout="vertical" requiredMark={false} onFinish={submit}>
        <div className="mb-6 flex items-center gap-4">
          <Avatar
            name={t('onboarding.title')}
            src={previewUrl ?? undefined}
            size="xl"
            fallbackClassName="text-heading-2"
          />
          <div>
            <p className="mb-2 text-label-md text-text-primary">{t('onboarding.avatar')}</p>
            <Button size="sm" onClick={() => inputRef.current?.click()}>
              {t('onboarding.chooseAvatar')}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => chooseAvatar(event.target.files?.[0])}
            />
          </div>
        </div>
        {avatarError ? <Alert variant="soft" tone="error" title={avatarError} /> : null}
        {createBrand.isError || completeOnboarding.isError ? (
          <Alert variant="soft" tone="error" title={t('onboarding.createFailed')} />
        ) : null}
        <Form.Item
          name="name"
          label={t('onboarding.name')}
          rules={[
            { required: true, whitespace: true, message: t('onboarding.nameRequired') },
            { min: 2, message: t('onboarding.nameMin') },
            { max: 120, message: t('onboarding.nameMax') },
          ]}
        >
          <Input size="lg" placeholder={t('onboarding.namePlaceholder')} allowClear />
        </Form.Item>
        <div className="mt-6 flex justify-end gap-3">
          <Button disabled={pending} onClick={() => void skip()}>
            {t('onboarding.skip')}
          </Button>
          <Button
            variant="primary"
            htmlType="submit"
            loading={createBrand.isPending || uploadAvatar.isPending}
          >
            {t('onboarding.create')}
          </Button>
        </div>
      </Form>
    </Modal>
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

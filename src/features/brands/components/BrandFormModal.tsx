import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Avatar, Button, Divider, Form, IconUpload, Input, Modal } from '@/shared/ui'
import { useApiErrorMessage } from '@/shared/hooks'

type Values = { name: string }
export type BrandFormSubmit = { name: string; avatar: File | null }

export function BrandFormModal({
  mode,
  open,
  initialName = '',
  avatarUrl,
  pending,
  disabled = false,
  error,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit'
  open: boolean
  initialName?: string
  avatarUrl?: string | null
  pending: boolean
  disabled?: boolean
  /** Failure of the last submit, translated by its API code. */
  error?: unknown
  onClose: () => void
  onSubmit: (values: BrandFormSubmit) => Promise<void>
}) {
  const { t } = useTranslation('brands')
  const errorMessage = useApiErrorMessage('brands')
  const [form] = Form.useForm<Values>()
  const inputRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  useEffect(() => {
    if (open) form.setFieldsValue({ name: initialName })
    else {
      form.resetFields()
      setAvatar(null)
      setAvatarError(null)
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [form, initialName, open])

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  const resetAvatar = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAvatar(null)
    setPreviewUrl(null)
    setAvatarError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const close = () => {
    if (pending) return
    form.resetFields()
    resetAvatar()
    onClose()
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

  const copy =
    mode === 'create'
      ? {
          title: t('createModal.title'),
          name: t('createModal.name'),
          error: t('createModal.error'),
          cancel: t('createModal.cancel'),
          submit: t('createModal.submit'),
        }
      : {
          title: t('editModal.title'),
          name: t('editModal.name'),
          error: t('editModal.error'),
          cancel: t('editModal.cancel'),
          submit: t('editModal.submit'),
        }

  return (
    <Modal open={open} title={null} width={380} floatingClose onClose={close} footer={null}>
      <Form<Values>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={({ name }) => void onSubmit({ name: name.trim(), avatar })}
      >
        <div className="mt-6 mb-4 flex w-full items-center justify-between gap-4">
          <Avatar
            name={initialName || copy.title}
            src={previewUrl ?? avatarUrl ?? undefined}
            size="xl"
            fallbackClassName="text-heading-2"
          />
          <Divider orientation="vertical" className="h-12" />
          <div className="min-w-0">
            <p className="mb-2 text-label-md text-text-primary">{t('createModal.avatar')}</p>
            <Button
              size="sm"
              icon={<IconUpload aria-hidden />}
              onClick={() => inputRef.current?.click()}
            >
              {t('createModal.uploadAvatar')}
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
        {error ? (
          <Alert variant="soft" tone="error" title={errorMessage(error, copy.error)} />
        ) : null}
        <Form.Item
          name="name"
          label={copy.name}
          rules={[
            { required: true, whitespace: true, message: t('createModal.nameRequired') },
            { min: 2, message: t('createModal.nameMin') },
            { max: 120, message: t('createModal.nameMax') },
          ]}
        >
          <Input size="lg" placeholder={t('createModal.namePlaceholder')} allowClear />
        </Form.Item>
        <div className="mt-6 flex w-full gap-3">
          <Button className="flex-1" disabled={pending} onClick={close}>
            {copy.cancel}
          </Button>
          <Button variant="primary" htmlType="submit" loading={pending} disabled={disabled}>
            {copy.submit}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

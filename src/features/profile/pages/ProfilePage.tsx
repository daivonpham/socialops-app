import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChangePasswordPage } from '@/features/auth'
import { GoogleIntegrationCard } from '@/features/google'
import { useAuth } from '@/shared/auth'
import {
  Alert,
  Avatar,
  Button,
  Form,
  IconCamera,
  Image,
  Input,
  Modal,
  Select,
  Tabs,
  useToast,
} from '@/shared/ui'
import profileBanner from '@/assets/profile-banner.png'
import { updateProfile, uploadAvatar } from '../api'
import { useApiErrorMessage } from '@/shared/hooks'

type ProfileTab = 'details' | 'password' | 'connections'
type ProfileValues = { displayName: string; email: string; locale: 'vi' | 'en' }

const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export default function ProfilePage() {
  const { t } = useTranslation('app')
  const errorMessage = useApiErrorMessage('app')
  const { t: tCommon } = useTranslation('common')
  const toast = useToast()
  const { user, updateUser } = useAuth()
  const [params, setParams] = useSearchParams()
  const [form] = Form.useForm<ProfileValues>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const requestedTab = params.get('tab')
  const tab: ProfileTab =
    requestedTab === 'password' || requestedTab === 'connections' ? requestedTab : 'details'
  const displayName = user?.displayName ?? user?.email ?? 'User'

  const closeAvatarPreview = () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    setSelectedAvatar(null)
    setAvatarPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const profileMutation = useMutation({
    mutationFn: (values: ProfileValues) => updateProfile(values.displayName, values.locale),
    onSuccess: (nextUser) => {
      updateUser(nextUser)
      form.setFieldsValue({
        displayName: nextUser.displayName,
        email: nextUser.email,
        locale: nextUser.locale,
      })
      setIsDirty(false)
      toast.success({ title: t('profile.saveSuccess') })
    },
  })
  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (nextUser) => {
      updateUser(nextUser)
      closeAvatarPreview()
      toast.success({ title: t('profile.avatarUploadSuccess') })
    },
  })

  useEffect(() => {
    form.setFieldsValue({
      displayName: user?.displayName ?? '',
      email: user?.email ?? '',
      locale: user?.locale ?? 'vi',
    })
  }, [form, user])

  useEffect(
    () => () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    },
    [avatarPreviewUrl],
  )

  const selectTab = (next: ProfileTab) => {
    setParams(next === 'details' ? {} : { tab: next }, { replace: true })
  }

  const resetProfile = () => {
    profileMutation.reset()
    form.setFieldsValue({
      displayName: user?.displayName ?? '',
      email: user?.email ?? '',
      locale: user?.locale ?? 'vi',
    })
    setIsDirty(false)
  }

  const chooseAvatar = (file?: File) => {
    setAvatarError(null)
    if (!file) return
    if (!ACCEPTED_AVATAR_TYPES.includes(file.type) || file.size > MAX_AVATAR_BYTES) {
      setAvatarError(t('profile.avatarInvalid'))
      return
    }
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    setSelectedAvatar(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
  }

  return (
    <section className="mx-auto w-full">
      <img
        src={profileBanner}
        alt=""
        className="h-profile-cover w-full rounded-md object-cover"
        aria-hidden="true"
      />

      <div className="px-5 pb-8 md:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="relative -mt-5 w-fit self-start sm:self-auto">
            <Avatar
              name={displayName}
              src={user?.avatarUrl ?? undefined}
              size="xxl"
              className="ring-4 ring-bg-surface"
            />
            <button
              type="button"
              className="absolute bottom-0 end-0 flex size-8 items-center justify-center rounded-full border-2 border-bg-surface bg-action-primary text-text-inverse shadow-sm transition-colors hover:bg-action-primary-hover"
              aria-label={t('profile.editAvatar')}
              onClick={() => fileInputRef.current?.click()}
            >
              <IconCamera />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => chooseAvatar(event.target.files?.[0])}
            />
          </div>
          <div className="min-w-0 pb-1">
            <h1 className="truncate text-heading-2 text-text-primary">{displayName}</h1>
            <p className="truncate text-body-md text-text-secondary">{user?.email}</p>
          </div>
        </header>

        {avatarError ? (
          <div className="mt-4">
            <Alert variant="soft" tone="error" title={avatarError} />
          </div>
        ) : null}

        <div className="mt-8">
          <Tabs
            variant="line"
            value={tab}
            ariaLabel={t('profile.tabsLabel')}
            onChange={selectTab}
            options={[
              { value: 'details', label: t('profile.detailsTab') },
              { value: 'password', label: t('profile.passwordTab') },
              { value: 'connections', label: t('profile.connectionsTab') },
            ]}
          />
        </div>

        <div className="pt-7">
          {tab === 'details' ? (
            <Form<ProfileValues>
              form={form}
              layout="horizontal"
              labelAlign="left"
              labelCol={{ xs: 24, md: 8 }}
              wrapperCol={{ xs: 24, md: 16 }}
              requiredMark
              onValuesChange={() => {
                profileMutation.reset()
                setIsDirty(true)
              }}
              onFinish={(values) => profileMutation.mutate(values)}
            >
              <header className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-heading-3 text-text-primary">{t('profile.detailsTitle')}</h2>
                  <p className="mt-1 text-body-md text-text-secondary">
                    {t('profile.detailsDescription')}
                  </p>
                </div>
                <div className="flex shrink-0 justify-end gap-3">
                  <Button disabled={!isDirty || profileMutation.isPending} onClick={resetProfile}>
                    {t('profile.cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    layered={false}
                    htmlType="submit"
                    disabled={!isDirty}
                    loading={profileMutation.isPending}
                  >
                    {t('profile.save')}
                  </Button>
                </div>
              </header>
              {profileMutation.isError ? (
                <div className="mt-6">
                  <Alert
                    variant="soft"
                    tone="error"
                    title={errorMessage(profileMutation.error, t('profile.saveError'))}
                  />
                </div>
              ) : null}
              <Form.Item
                className="mb-0 border-b border-border-subtle py-6"
                name="displayName"
                label={t('profile.name')}
                rules={[
                  { required: true, message: t('profile.nameRequired') },
                  { min: 2, message: t('profile.nameMin') },
                  { max: 120, message: t('profile.nameMax') },
                ]}
              >
                <Input size="lg" autoComplete="name" allowClear />
              </Form.Item>
              <Form.Item
                className="mb-0 border-b border-border-subtle py-6"
                name="email"
                label={t('profile.email')}
              >
                <Input size="lg" autoComplete="email" readOnly disabled />
              </Form.Item>
              <Form.Item
                className="mb-0 border-b border-border-subtle py-6"
                name="locale"
                label={t('profile.language')}
              >
                <Select
                  className="w-full max-w-80"
                  showSearch={false}
                  options={[
                    {
                      value: 'vi',
                      label: (
                        <span className="inline-flex items-center gap-2.5">
                          <span
                            className="inline-flex size-6 items-center justify-center overflow-hidden rounded-full text-xl"
                            aria-hidden="true"
                          >
                            🇻🇳
                          </span>
                          {tCommon('locales.viVN')}
                        </span>
                      ),
                    },
                    {
                      value: 'en',
                      label: (
                        <span className="inline-flex items-center gap-2.5">
                          <span
                            className="inline-flex size-6 items-center justify-center overflow-hidden rounded-full text-xl"
                            aria-hidden="true"
                          >
                            🇺🇸
                          </span>
                          {tCommon('locales.enUS')}
                        </span>
                      ),
                    },
                  ]}
                />
              </Form.Item>
            </Form>
          ) : tab === 'password' ? (
            <ChangePasswordPage embedded />
          ) : (
            <div className="grid gap-6">
              <header className="border-b border-border-subtle pb-6">
                <h2 className="text-heading-3 text-text-primary">
                  {t('profile.connectionsTitle')}
                </h2>
                <p className="mt-1 text-body-md text-text-secondary">
                  {t('profile.connectionsDescription')}
                </p>
              </header>
              <GoogleIntegrationCard />
            </div>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(selectedAvatar && avatarPreviewUrl)}
        title={t('profile.avatarPreview')}
        onClose={closeAvatarPreview}
        footer={
          <div className="flex justify-end gap-3">
            <Button disabled={avatarMutation.isPending} onClick={closeAvatarPreview}>
              {t('profile.cancel')}
            </Button>
            <Button
              variant="primary"
              layered={false}
              loading={avatarMutation.isPending}
              onClick={() => selectedAvatar && avatarMutation.mutate(selectedAvatar)}
            >
              {t('profile.save')}
            </Button>
          </div>
        }
      >
        <div className="grid justify-items-center gap-4 py-4">
          {avatarPreviewUrl ? (
            <Image
              src={avatarPreviewUrl}
              alt={t('profile.avatarPreview')}
              preview={false}
              className="size-profile-avatar-preview rounded-full object-cover"
              wrapperClassName="size-profile-avatar-preview overflow-hidden rounded-full"
            />
          ) : null}
          <p className="text-body-sm text-text-secondary">{t('profile.avatarHint')}</p>
          {avatarMutation.isError ? (
            <Alert
              variant="soft"
              tone="error"
              title={errorMessage(avatarMutation.error, t('profile.avatarUploadError'))}
            />
          ) : null}
        </div>
      </Modal>
    </section>
  )
}

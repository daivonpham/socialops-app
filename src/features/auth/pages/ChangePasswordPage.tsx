import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/auth'
import { Alert, Button, Form, Input, useToast } from '@/shared/ui'
import { useChangePassword } from '../api'
import { SetPasswordPanel } from '../components/SetPasswordPanel'
import { useNewPasswordRules } from '../model/password-policy'
import { useApiErrorMessage } from '@/shared/hooks'

type ChangePasswordValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ChangePasswordPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth()
  if (user && !user.hasPassword) return <SetPasswordPanel email={user.email} embedded={embedded} />
  return <ChangePasswordForm embedded={embedded} />
}

function ChangePasswordForm({ embedded }: { embedded: boolean }) {
  const { t } = useTranslation('auth')
  const errorMessage = useApiErrorMessage('auth')
  const newPasswordRules = useNewPasswordRules()
  const toast = useToast()
  const change = useChangePassword()
  const [form] = Form.useForm<ChangePasswordValues>()
  const [isDirty, setIsDirty] = useState(false)

  const submit = (values: ChangePasswordValues) => {
    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          form.resetFields()
          setIsDirty(false)
          toast.success({ title: t('change.success') })
        },
      },
    )
  }

  return (
    <section className={embedded ? 'w-full' : 'mx-auto w-full max-w-auth'}>
      <Form<ChangePasswordValues>
        form={form}
        layout="horizontal"
        labelAlign="left"
        labelCol={{ xs: 24, md: 8 }}
        wrapperCol={{ xs: 24, md: 16 }}
        requiredMark
        onValuesChange={() => setIsDirty(true)}
        onFinish={submit}
      >
        <header className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-heading-2 text-text-primary">{t('change.title')}</h1>
            <p className="mt-2 text-body-md text-text-secondary">{t('change.description')}</p>
          </div>
          <div className="flex shrink-0 justify-end gap-3">
            <Button
              disabled={!isDirty || change.isPending}
              onClick={() => {
                form.resetFields()
                setIsDirty(false)
              }}
            >
              {t('change.cancel')}
            </Button>
            <Button
              variant="primary"
              layered={false}
              htmlType="submit"
              disabled={!isDirty}
              loading={change.isPending}
            >
              {t('change.submit')}
            </Button>
          </div>
        </header>
        {change.isError ? (
          <div className="mt-6">
            <Alert variant="soft" tone="error" title={errorMessage(change.error)} />
          </div>
        ) : null}
        <Form.Item
          className="mb-0 border-b border-border-subtle py-6"
          name="currentPassword"
          label={t('fields.currentPassword')}
          rules={[{ required: true, message: t('validation.passwordRequired') }]}
        >
          <Input type="password" size="lg" autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          className="mb-0 border-b border-border-subtle py-6"
          name="newPassword"
          label={t('fields.newPassword')}
          rules={newPasswordRules}
        >
          <Input type="password" size="lg" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          className="mb-0 border-b border-border-subtle py-6"
          name="confirmPassword"
          label={t('fields.confirmPassword')}
          dependencies={['newPassword']}
          rules={[
            { required: true, message: t('validation.confirmPasswordRequired') },
            Form.rules.sameAs('newPassword', t('fields.passwordMismatch')),
          ]}
        >
          <Input type="password" size="lg" autoComplete="new-password" />
        </Form.Item>
      </Form>
    </section>
  )
}

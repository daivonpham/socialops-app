import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Form, Input, useToast } from '@/shared/ui'
import { useResetPassword } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { BackToLoginLink } from '../components/BackToLoginLink'
import { AUTH_ROUTES } from '../config/auth.routes'
import { PASSWORD_MIN_LENGTH, useNewPasswordRules } from '../model/password-policy'
import { useApiErrorMessage } from '@/shared/hooks'

type ResetPasswordValues = { password: string; confirmPassword: string }

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const errorMessage = useApiErrorMessage('auth')
  const newPasswordRules = useNewPasswordRules()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const reset = useResetPassword()
  const token = params.get('token') ?? ''

  const submit = ({ password }: ResetPasswordValues) =>
    reset.mutate(
      { token, password },
      {
        onSuccess: () => {
          toast.success({ title: t('reset.success') })
          navigate(AUTH_ROUTES.LOGIN, { replace: true })
        },
      },
    )

  return (
    <AuthLayout
      title={t('reset.title')}
      description={t('reset.description', { min: PASSWORD_MIN_LENGTH })}
      footer={<BackToLoginLink />}
    >
      {!token ? (
        <Alert variant="soft" tone="error" title={t('reset.missingToken')} />
      ) : (
        <Form<ResetPasswordValues> layout="vertical" requiredMark={false} onFinish={submit}>
          {reset.isError ? (
            <Alert variant="soft" tone="error" title={errorMessage(reset.error)} />
          ) : null}
          <Form.Item name="password" label={t('fields.newPassword')} rules={newPasswordRules}>
            <Input type="password" size="lg" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('fields.confirmPassword')}
            dependencies={['password']}
            rules={[
              { required: true, message: t('validation.confirmPasswordRequired') },
              Form.rules.sameAs('password', t('fields.passwordMismatch')),
            ]}
          >
            <Input type="password" size="lg" autoComplete="new-password" />
          </Form.Item>
          <Button
            variant="primary"
            size="lg"
            htmlType="submit"
            className="w-full"
            loading={reset.isPending}
          >
            {t('reset.submit')}
          </Button>
        </Form>
      )}
    </AuthLayout>
  )
}

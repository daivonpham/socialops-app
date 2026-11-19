import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Form, IconGoogle, Input } from '@/shared/ui'
import { useAuth } from '@/shared/auth'
import { useLogin, useStartGoogleAuth } from '../api'
import { PASSWORD_MAX_LENGTH } from '../model/password-policy'
import { AuthLayout } from '../components/AuthLayout'
import { LegalConsent } from '../components/LegalConsent'
import { AUTH_ROUTES } from '../config/auth.routes'
import { rememberPendingInvitation } from '../model/pending-invitation'
import { CodedError, parseErrorCode } from '@/shared/api/errors'
import { useApiErrorMessage } from '@/shared/hooks'

type LoginFormValues = { email: string; password: string }

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const errorMessage = useApiErrorMessage('auth')
  const [params] = useSearchParams()
  const { authenticate } = useAuth()
  const login = useLogin()
  const google = useStartGoogleAuth()
  const invitation = params.get('invitation')
  const invitedEmail = params.get('email') ?? undefined

  useEffect(() => {
    if (invitation) rememberPendingInvitation(invitation)
  }, [invitation])

  const submit = (values: LoginFormValues) => {
    login.mutate(values, {
      // The guest-only guard redirects once authenticated (to a pending invitation if any);
      // navigating here too would race it and leave a blank screen.
      onSuccess: (session) => authenticate(session),
    })
  }

  const startGoogle = () => {
    google.mutate(undefined, {
      onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl),
    })
  }

  return (
    <AuthLayout
      title={t('login.title')}
      description={t('login.description')}
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link
            className="font-semibold text-link hover:text-link-hover"
            to={
              invitation
                ? `${AUTH_ROUTES.REGISTER}?${new URLSearchParams({ invitation, ...(invitedEmail ? { email: invitedEmail } : {}) })}`
                : AUTH_ROUTES.REGISTER
            }
          >
            {t('login.register')}
          </Link>
        </>
      }
    >
      <Form<LoginFormValues>
        layout="vertical"
        requiredMark={false}
        initialValues={{ email: invitedEmail }}
        onFinish={submit}
      >
        {params.get('oauth') === 'failed' ? (
          <Alert
            variant="soft"
            tone="error"
            title={errorMessage(
              new CodedError(parseErrorCode(params.get('error'), 'GOOGLE_AUTH_FAILED')),
            )}
          />
        ) : null}
        {login.isError ? (
          <Alert variant="soft" tone="error" title={errorMessage(login.error)} />
        ) : null}
        <Form.Item
          name="email"
          label={t('fields.email')}
          rules={[
            { required: true, message: t('validation.emailRequired') },
            Form.rules.email(t('validation.emailInvalid')),
          ]}
        >
          <Input
            type="email"
            size="lg"
            placeholder={t('fields.emailPlaceholder')}
            autoComplete="email"
            allowClear
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={t('fields.password')}
          rules={[
            { required: true, message: t('validation.passwordRequired') },
            {
              max: PASSWORD_MAX_LENGTH,
              message: t('validation.passwordMax', { max: PASSWORD_MAX_LENGTH }),
            },
          ]}
        >
          <Input
            type="password"
            size="lg"
            placeholder={t('fields.passwordPlaceholder')}
            autoComplete="current-password"
          />
        </Form.Item>
        <div className="mb-5 flex justify-end">
          <Link
            to={AUTH_ROUTES.FORGOT_PASSWORD}
            className="text-label-sm text-link hover:text-link-hover"
          >
            {t('login.forgotPassword')}
          </Link>
        </div>
        <div className="grid gap-5">
          <Button
            variant="primary"
            size="lg"
            htmlType="submit"
            className="w-full"
            loading={login.isPending}
          >
            {t('login.submit')}
          </Button>
          <Button
            size="lg"
            className="w-full"
            icon={<IconGoogle />}
            loading={google.isPending}
            onClick={startGoogle}
          >
            {t('login.google')}
          </Button>
          <LegalConsent />
        </div>
      </Form>
    </AuthLayout>
  )
}

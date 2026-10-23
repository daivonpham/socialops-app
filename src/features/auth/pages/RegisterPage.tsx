import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Form, IconGoogle, Input } from '@/shared/ui'
import { useAuth } from '@/shared/auth'
import { useLogin, useRegister, useStartGoogleAuth } from '../api'
import type { RegisterInput } from '../api'
import { getAuthErrorKey } from '../model/auth-error'
import { AuthLayout } from '../components/AuthLayout'
import { BackToLoginLink } from '../components/BackToLoginLink'
import { AUTH_ROUTES } from '../config/auth.routes'
import { rememberPendingInvitation } from '../model/pending-invitation'

type RegisterFormValues = { name: string; email: string; password: string }

function getInboxUrl(email: string | undefined) {
  const domain = email?.split('@')[1]?.toLowerCase()

  if (domain === 'gmail.com' || domain === 'googlemail.com') return 'https://mail.google.com/'
  if (domain && ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) {
    return 'https://outlook.live.com/mail/'
  }
  if (domain === 'yahoo.com') return 'https://mail.yahoo.com/'
  if (domain && ['icloud.com', 'me.com', 'mac.com'].includes(domain)) {
    return 'https://www.icloud.com/mail/'
  }
  if (domain === 'proton.me' || domain === 'protonmail.com') return 'https://mail.proton.me/'
  if (domain === 'zoho.com') return 'https://mail.zoho.com/'

  return null
}

export default function RegisterPage() {
  const { t } = useTranslation('auth')
  const register = useRegister()
  const resend = useRegister()
  const google = useStartGoogleAuth()
  const login = useLogin()
  const { authenticate } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const invitation = params.get('invitation')
  // The invited address is fixed: the invitation link proves ownership of this email only.
  const invitedEmail = invitation ? (params.get('email') ?? undefined) : undefined
  const [registeredInput, setRegisteredInput] = useState<RegisterInput | null>(null)

  useEffect(() => {
    if (invitation) rememberPendingInvitation(invitation)
  }, [invitation])

  const submit = (values: RegisterFormValues) => {
    const input: RegisterInput = {
      displayName: values.name,
      email: invitedEmail ?? values.email,
      password: values.password,
      locale: document.documentElement.lang.startsWith('vi') ? 'vi' : 'en',
      ...(invitation ? { invitationToken: invitation } : {}),
    }
    register.mutate(input, {
      onSuccess: (result) => {
        if (result.verificationRequired) {
          setRegisteredInput(input)
          return
        }
        login.mutate(
          { email: input.email, password: input.password },
          {
            // The guest-only guard redirects once authenticated (see LoginPage).
            onSuccess: (session) => authenticate(session),
            onError: () => navigate(AUTH_ROUTES.LOGIN, { replace: true }),
          },
        )
      },
    })
  }

  if (registeredInput) {
    const registeredEmail = registeredInput.email
    const inboxUrl = getInboxUrl(registeredEmail)
    const openInbox = () => {
      if (inboxUrl) window.open(inboxUrl, '_blank', 'noopener,noreferrer')
      else window.location.href = 'mailto:'
    }

    return (
      <AuthLayout
        title={t('register.successTitle')}
        description={
          <>
            {t('register.successDescription')}
            <strong className="mt-1 block font-semibold text-text-primary">
              {registeredEmail}
            </strong>
          </>
        }
        footer=""
      >
        <div className="grid gap-8">
          <Button variant="primary" size="lg" className="w-full" onClick={openInbox}>
            {t('register.openEmail')}
          </Button>

          <div className="text-center text-body-sm text-text-secondary">
            <span>{t('register.resendPrompt')} </span>
            <button
              type="button"
              disabled={resend.isPending}
              className="font-semibold text-link outline-none hover:text-link-hover focus-visible:focus-ring disabled:text-text-disabled"
              onClick={() => resend.mutate(registeredInput)}
            >
              {resend.isPending ? t('register.resending') : t('register.resend')}
            </button>
            {resend.isSuccess ? (
              <p className="mt-2 text-success-700">{t('register.resendSuccess')}</p>
            ) : null}
            {resend.isError ? (
              <p className="mt-2 text-error-700">{t('register.resendError')}</p>
            ) : null}
          </div>

          <div className="text-center">
            <BackToLoginLink />
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={t('register.title')}
      description={t('register.description')}
      footer={
        <>
          {t('register.hasAccount')}{' '}
          <Link
            className="font-semibold text-link hover:text-link-hover"
            to={
              invitation
                ? `${AUTH_ROUTES.LOGIN}?${new URLSearchParams({ invitation, ...(invitedEmail ? { email: invitedEmail } : {}) })}`
                : AUTH_ROUTES.LOGIN
            }
          >
            {t('register.login')}
          </Link>
        </>
      }
    >
      <Form<RegisterFormValues>
        layout="vertical"
        requiredMark={false}
        initialValues={{ email: invitedEmail }}
        onFinish={submit}
      >
        {register.isError ? (
          <Alert variant="soft" tone="error" title={t(getAuthErrorKey(register.error))} />
        ) : null}
        <Form.Item
          name="name"
          label={t('fields.name')}
          rules={[
            { required: true, message: t('validation.nameRequired') },
            { min: 2, message: t('validation.nameMin') },
            { max: 120, message: t('validation.nameMax') },
          ]}
        >
          <Input
            size="lg"
            placeholder={t('fields.namePlaceholder')}
            autoComplete="name"
            allowClear
          />
        </Form.Item>
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
            allowClear={!invitedEmail}
            disabled={Boolean(invitedEmail)}
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={t('fields.password')}
          // extra={t('register.passwordHint')}
          rules={[
            { required: true, message: t('validation.passwordRequired') },
            { min: 12, message: t('validation.passwordMin') },
            { max: 128, message: t('validation.passwordMax') },
          ]}
        >
          <Input
            type="password"
            size="lg"
            placeholder={t('fields.createPasswordPlaceholder')}
            autoComplete="new-password"
          />
        </Form.Item>
        <div className="grid gap-5 pt-2">
          <Button
            variant="primary"
            size="md"
            htmlType="submit"
            className="w-full"
            loading={register.isPending || login.isPending}
          >
            {t('register.submit')}
          </Button>
          <Button
            size="lg"
            className="w-full"
            icon={<IconGoogle />}
            loading={google.isPending}
            onClick={() =>
              google.mutate(undefined, {
                onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl),
              })
            }
          >
            {t('register.google')}
          </Button>
        </div>
      </Form>
    </AuthLayout>
  )
}

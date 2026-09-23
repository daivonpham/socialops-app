import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Form, IconGoogle, Input } from '@/shared/ui'
import { useRegister, useStartGoogleAuth } from '../api'
import { getAuthErrorKey } from '../model/auth-error'
import { AuthLayout } from '../components/AuthLayout'
import { AUTH_ROUTES } from '../config/auth.routes'

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
  const google = useStartGoogleAuth()

  const submit = (values: RegisterFormValues) => {
    register.mutate({
      displayName: values.name,
      email: values.email,
      password: values.password,
      locale: document.documentElement.lang.startsWith('vi') ? 'vi' : 'en',
    })
  }

  if (register.isSuccess) {
    const registeredEmail = register.variables.email
    const inboxUrl = getInboxUrl(registeredEmail)

    return (
      <AuthLayout
        title={t('register.successTitle')}
        description={t('register.successDescription', { email: registeredEmail })}
        footer={
          <Link className="font-semibold text-link" to={AUTH_ROUTES.LOGIN}>
            {t('register.login')}
          </Link>
        }
      >
        <div className="grid gap-4">
          <Alert variant="soft" tone="success" title={t('register.checkEmail')} />
          {inboxUrl ? (
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => window.open(inboxUrl, '_blank', 'noopener,noreferrer')}
            >
              {t('register.openEmail')}
            </Button>
          ) : null}
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
          <Link className="font-semibold text-link hover:text-link-hover" to={AUTH_ROUTES.LOGIN}>
            {t('register.login')}
          </Link>
        </>
      }
    >
      <Form<RegisterFormValues> layout="vertical" requiredMark={false} onFinish={submit}>
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
            allowClear
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
            loading={register.isPending}
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

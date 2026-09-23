import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Input } from '@/shared/ui'
import { useForgotPassword } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { AUTH_ROUTES } from '../config/auth.routes'

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const request = useForgotPassword()
  const [submitted, setSubmitted] = useState(false)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    request.mutate({ email: String(form.get('email')) }, { onSuccess: () => setSubmitted(true) })
  }

  return (
    <AuthLayout
      title={t('forgot.title')}
      description={t('forgot.description')}
      footer={
        <Link className="font-semibold text-link" to={AUTH_ROUTES.LOGIN}>
          {t('forgot.back')}
        </Link>
      }
    >
      {submitted ? (
        <Alert tone="success" variant="soft" title={t('forgot.success')} />
      ) : (
        <form className="grid gap-5" onSubmit={submit}>
          {request.isError ? <Alert variant="soft" tone="error" title={t('errors.UNKNOWN')} /> : null}
          <Input
            id="forgot-email"
            name="email"
            type="email"
            size="lg"
            label={t('fields.email')}
            placeholder={t('fields.emailPlaceholder')}
            autoComplete="email"
            required
          />
          <Button variant="primary" size="lg" htmlType="submit" loading={request.isPending}>
            {t('forgot.submit')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Input } from '@/shared/ui'
import { useForgotPassword } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { BackToLoginLink } from '../components/BackToLoginLink'

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
      footer={<BackToLoginLink />}
    >
      {submitted ? (
        <Alert tone="success" variant="soft" title={t('forgot.success')} />
      ) : (
        <form className="grid gap-5" onSubmit={submit}>
          {request.isError ? (
            <Alert variant="soft" tone="error" title={t('errors.UNKNOWN')} />
          ) : null}
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

import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Input } from '@/shared/ui'
import { useResetPassword } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { BackToLoginLink } from '../components/BackToLoginLink'
import { AUTH_ROUTES } from '../config/auth.routes'
import { getAuthErrorKey } from '../model/auth-error'

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const reset = useResetPassword()
  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const token = params.get('token') ?? ''

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    if (password !== String(form.get('confirmPassword'))) {
      setPasswordMismatch(true)
      return
    }
    setPasswordMismatch(false)
    reset.mutate({ token, password })
  }

  return (
    <AuthLayout
      title={t('reset.title')}
      description={t('reset.description')}
      footer={<BackToLoginLink />}
    >
      {!token ? (
        <Alert variant="soft" tone="error" title={t('reset.missingToken')} />
      ) : reset.isSuccess ? (
        <div className="grid gap-5">
          <Alert variant="soft" tone="success" title={t('reset.success')} />
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(AUTH_ROUTES.LOGIN, { replace: true })}
          >
            {t('reset.login')}
          </Button>
        </div>
      ) : (
        <form className="grid gap-5" onSubmit={submit}>
          {reset.isError ? (
            <Alert variant="soft" tone="error" title={t(getAuthErrorKey(reset.error))} />
          ) : null}
          <Input
            id="reset-password"
            name="password"
            type="password"
            size="lg"
            label={t('fields.newPassword')}
            autoComplete="new-password"
            minLength={12}
            required
          />
          <Input
            id="reset-confirm"
            name="confirmPassword"
            type="password"
            size="lg"
            label={t('fields.confirmPassword')}
            autoComplete="new-password"
            minLength={12}
            required
          />
          {passwordMismatch ? (
            <Alert variant="soft" tone="error" title={t('fields.passwordMismatch')} />
          ) : null}
          <Button variant="primary" size="lg" htmlType="submit" loading={reset.isPending}>
            {t('reset.submit')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}

import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, Spin } from '@/shared/ui'
import { useVerifyEmail } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { BackToLoginLink } from '../components/BackToLoginLink'
import { AUTH_ROUTES } from '../config/auth.routes'

export default function VerifyEmailPage() {
  const { t } = useTranslation('auth')
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const verify = useVerifyEmail()
  const { mutate: verifyToken } = verify

  useEffect(() => {
    if (token) verifyToken({ token })
  }, [token, verifyToken])

  return (
    <AuthLayout
      title={t('verify.title')}
      description={t('verify.description')}
      footer={<BackToLoginLink />}
    >
      {!token ? (
        <Alert variant="soft" tone="error" title={t('verify.missingToken')} />
      ) : verify.isPending || verify.isIdle ? (
        <div className="flex justify-center">
          <Spin size="lg" />
        </div>
      ) : verify.isSuccess ? (
        <Alert variant="soft" tone="success" title={t('verify.success')} />
      ) : (
        <div className="grid gap-4">
          <Alert variant="soft" tone="error" title={t('verify.failure')} />
          <Link
            className="text-center font-semibold text-link hover:text-link-hover"
            to={AUTH_ROUTES.REGISTER}
          >
            {t('verify.registerAgain')}
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}

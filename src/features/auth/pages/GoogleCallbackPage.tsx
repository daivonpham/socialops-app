import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, Spin } from '@/shared/ui'
import { useAuth } from '@/shared/auth'
import { AuthLayout } from '../components/AuthLayout'
import { AUTH_ROUTES } from '../config/auth.routes'

export default function GoogleCallbackPage() {
  const { t } = useTranslation('auth')
  const { status } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const providerError = params.has('error')
  useEffect(() => {
    if (providerError || status === 'anonymous') {
      navigate(`${AUTH_ROUTES.LOGIN}?oauth=failed`, { replace: true })
      return
    }
    if (status === 'authenticated') navigate(AUTH_ROUTES.POST_AUTH, { replace: true })
  }, [navigate, providerError, status])

  return (
    <AuthLayout title={t('google.title')} description={t('google.description')} footer="">
      <div className="flex justify-center">
        <Spin size="lg" />
      </div>
      <Alert variant="soft" tone="info" title={t('google.finishing')} />
    </AuthLayout>
  )
}

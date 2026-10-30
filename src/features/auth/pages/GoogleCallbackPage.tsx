import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, Spin } from '@/shared/ui'
import { useAuth } from '@/shared/auth'
import { AuthLayout } from '../components/AuthLayout'
import { AUTH_ROUTES } from '../config/auth.routes'
import { pendingInvitationPath } from '../model/pending-invitation'
import { parseErrorCode } from '@/shared/api/errors'

export default function GoogleCallbackPage() {
  const { t } = useTranslation('auth')
  const { status, restore } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const providerError = params.has('error')
  useEffect(() => {
    if (!providerError && status === 'idle') void restore()
  }, [providerError, restore, status])

  useEffect(() => {
    if (providerError || status === 'anonymous') {
      // Cancelling Google consent is a normal choice, not a failure worth an error message.
      const code = parseErrorCode(params.get('error'), 'GOOGLE_AUTH_FAILED')
      const failed = new URLSearchParams({ oauth: 'failed', error: code })
      navigate(
        code === 'GOOGLE_AUTH_CANCELLED' ? AUTH_ROUTES.LOGIN : `${AUTH_ROUTES.LOGIN}?${failed}`,
        {
          replace: true,
        },
      )
      return
    }
    if (status === 'authenticated')
      navigate(pendingInvitationPath() ?? AUTH_ROUTES.POST_AUTH, { replace: true })
  }, [navigate, params, providerError, status])

  return (
    <AuthLayout title={t('google.title')} description={t('google.description')} footer="">
      <div className="flex justify-center">
        <Spin size="lg" />
      </div>
      <Alert variant="soft" tone="info" title={t('google.finishing')} />
    </AuthLayout>
  )
}

import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, IconGoogle, Spin } from '@/shared/ui'
import { reportGoogleOAuthResult } from '../api'
import { CodedError, parseErrorCode } from '@/shared/api/errors'
import { useApiErrorMessage } from '@/shared/hooks'

const REPORTS_PATH = '/reports'

/**
 * Where Google consent for Sheets exports lands (via the API). It reports the result to the
 * window that opened the popup, then closes itself.
 */
export default function GoogleSheetsCallbackPage() {
  const { t } = useTranslation('google')
  const errorMessage = useApiErrorMessage('google')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const error = params.get('error')
  const email = params.get('email') ?? undefined
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    reportGoogleOAuthResult(error ? { error } : { email })
    window.close()
  }, [email, error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg-page p-6 text-center">
      <IconGoogle className="text-icon-lg" aria-hidden />
      {error ? (
        <>
          <p className="max-w-md text-body-md text-text-secondary">
            {errorMessage(
              new CodedError(parseErrorCode(error, 'GOOGLE_AUTH_FAILED')),
              t('callback.failed'),
            )}
          </p>
          <Button onClick={() => navigate(REPORTS_PATH)}>{t('callback.back')}</Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 text-body-sm text-text-secondary">
            <Spin size="lg" />
            {t('callback.connected')}
          </div>
          <Button onClick={() => navigate(REPORTS_PATH)}>{t('callback.back')}</Button>
        </>
      )}
    </div>
  )
}

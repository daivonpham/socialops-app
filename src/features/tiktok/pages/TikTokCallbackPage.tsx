import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { SOCIAL_ACCOUNT_QUERY_KEYS } from '@/features/social-accounts'
import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'
import { Button, IconTikTok, Spin, useToast } from '@/shared/ui'
import { TIKTOK_QUERY_KEYS } from '../api'
import { TIKTOK_ROUTES } from '../config/tiktok.routes'
import { CodedError, parseErrorCode } from '@/shared/api/errors'
import { useApiErrorMessage } from '@/shared/hooks'

export default function TikTokCallbackPage() {
  const { t } = useTranslation('tiktok')
  const errorMessage = useApiErrorMessage('tiktok')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const client = useQueryClient()
  const brandId = params.get('brandId')
  const accountId = params.get('accountId')
  const error = params.get('error')
  const missingScopes = params.get('missingScopes')
  const isPopup = Boolean(window.opener && window.opener !== window)
  const sent = useRef(false)
  const completed = useRef(false)
  const { workspaceId } = useActiveWorkspace()
  const { selectBrand } = useActiveBrand()

  useEffect(() => {
    if (!isPopup || sent.current) return
    sent.current = true
    window.opener.postMessage(
      { type: 'socialops.tiktok.oauth', brandId, accountId, missingScopes, error },
      window.location.origin,
    )
    window.close()
  }, [isPopup, brandId, accountId, missingScopes, error])

  useEffect(() => {
    if (isPopup || completed.current) return
    completed.current = true
    if (error === 'TIKTOK_OAUTH_CANCELLED') {
      toast.info({ title: t('oauth.cancelled') })
      navigate(TIKTOK_ROUTES.OVERVIEW, { replace: true })
      return
    }
    if (error || !brandId || !accountId) {
      toast.error({
        title: errorMessage(
          new CodedError(parseErrorCode(error, 'TIKTOK_OAUTH_FAILED')),
          t('oauth.failed'),
        ),
      })
      return
    }
    if (workspaceId) selectBrand(workspaceId, brandId)
    void Promise.all([
      client.invalidateQueries({ queryKey: TIKTOK_QUERY_KEYS.root(brandId) }),
      client.invalidateQueries({ queryKey: SOCIAL_ACCOUNT_QUERY_KEYS.counts(brandId) }),
    ])
    if (missingScopes) toast.warning({ title: t('oauth.missingScopes') })
    else toast.success({ title: t('oauth.connected') })
    navigate(TIKTOK_ROUTES.OVERVIEW, { replace: true })
  }, [
    isPopup,
    brandId,
    accountId,
    missingScopes,
    error,
    workspaceId,
    selectBrand,
    toast,
    t,
    navigate,
    client,
  ])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg-page p-6">
      <IconTikTok className="text-icon-lg text-text-primary" />
      {error || !brandId || !accountId ? (
        <Button onClick={() => navigate(TIKTOK_ROUTES.OVERVIEW)}>{t('oauth.back')}</Button>
      ) : (
        <div className="flex items-center gap-3 text-body-sm text-text-secondary">
          <Spin size="lg" />
          {t('oauth.completing')}
        </div>
      )}
    </div>
  )
}

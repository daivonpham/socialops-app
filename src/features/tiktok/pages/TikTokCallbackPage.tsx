import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { SOCIAL_ACCOUNT_QUERY_KEYS } from '@/features/social-accounts'
import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'
import { Button, IconTikTok, Spin, useToast } from '@/shared/ui'
import { TIKTOK_QUERY_KEYS } from '../api'

const TIKTOK_OVERVIEW_PATH = '/platforms/tiktok/overview'

export default function TikTokCallbackPage() {
  const { t } = useTranslation('tiktok')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const client = useQueryClient()
  const brandId = params.get('brandId')
  const accountId = params.get('accountId')
  const error = params.get('error')
  const isPopup = Boolean(window.opener && window.opener !== window)
  const sent = useRef(false)
  const completed = useRef(false)
  const { workspaceId } = useActiveWorkspace()
  const { selectBrand } = useActiveBrand()

  useEffect(() => {
    if (!isPopup || sent.current) return
    sent.current = true
    window.opener.postMessage(
      { type: 'socialops.tiktok.oauth', brandId, accountId, error },
      window.location.origin,
    )
    window.close()
  }, [isPopup, brandId, accountId, error])

  useEffect(() => {
    if (isPopup || completed.current) return
    completed.current = true
    if (error || !brandId || !accountId) {
      toast.error({ title: t('oauthFailed') })
      return
    }
    if (workspaceId) selectBrand(workspaceId, brandId)
    void Promise.all([
      client.invalidateQueries({ queryKey: TIKTOK_QUERY_KEYS.root(brandId) }),
      client.invalidateQueries({ queryKey: SOCIAL_ACCOUNT_QUERY_KEYS.counts(brandId) }),
    ])
    toast.success({ title: t('connectSuccess') })
    navigate(TIKTOK_OVERVIEW_PATH, { replace: true })
  }, [isPopup, brandId, accountId, error, workspaceId, selectBrand, toast, t, navigate, client])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg-page p-6">
      <IconTikTok className="text-icon-lg text-text-primary" />
      {error || !brandId || !accountId ? (
        <Button onClick={() => navigate(TIKTOK_OVERVIEW_PATH)}>{t('back')}</Button>
      ) : (
        <div className="flex items-center gap-3 text-body-sm text-text-secondary">
          <Spin size="lg" />
          {t('completing')}
        </div>
      )}
    </div>
  )
}

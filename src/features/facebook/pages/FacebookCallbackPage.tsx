import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'
import { Alert, Button, Checkbox, IconFacebook, SectionError, Spin, useToast } from '@/shared/ui'
import { useAvailableFacebookPages, useSelectFacebookPages } from '../api'
import { useApiErrorMessage } from '@/shared/hooks'

const FACEBOOK_OVERVIEW_PATH = '/platforms/facebook/overview'

export default function FacebookCallbackPage() {
  const { t } = useTranslation('facebook')
  const errorMessage = useApiErrorMessage('facebook')
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const brandId = params.get('brandId')
  const connectionId = params.get('connectionId')
  const autoConnected = params.get('autoConnected') === 'true'
  const pageId = params.get('pageId')
  const restoredPages = Number(params.get('restoredPages') ?? 0)
  const revokedPages = Number(params.get('revokedPages') ?? 0)
  const callbackError = params.get('error')
  const isPopup = Boolean(window.opener && window.opener !== window)
  const { workspaceId } = useActiveWorkspace()
  const { selectBrand } = useActiveBrand()
  const pages = useAvailableFacebookPages(
    isPopup || autoConnected ? null : brandId,
    isPopup || autoConnected ? null : connectionId,
  )
  const selectPages = useSelectFacebookPages(brandId)
  const [selected, setSelected] = useState<string[]>([])
  const initializedSelection = useRef(false)
  const oauthMessageSent = useRef(false)
  const autoCompletionHandled = useRef(false)

  useEffect(() => {
    if (!isPopup || oauthMessageSent.current) return
    oauthMessageSent.current = true
    window.opener.postMessage(
      {
        type: 'socialops.facebook.oauth',
        brandId,
        connectionId,
        autoConnected,
        pageId,
        restoredPages,
        revokedPages,
        error: callbackError,
      },
      window.location.origin,
    )
    window.close()
  }, [
    autoConnected,
    brandId,
    callbackError,
    connectionId,
    isPopup,
    pageId,
    restoredPages,
    revokedPages,
  ])

  useEffect(() => {
    if (isPopup || !autoConnected || !brandId || callbackError || autoCompletionHandled.current)
      return
    autoCompletionHandled.current = true
    if (workspaceId) selectBrand(workspaceId, brandId)
    toast.success({ title: t('oauth.connected') })
    if (revokedPages) toast.warning({ title: t('tokenHealth.revoked', { count: revokedPages }) })
    navigate(
      pageId
        ? `${FACEBOOK_OVERVIEW_PATH}?pageId=${encodeURIComponent(pageId)}`
        : FACEBOOK_OVERVIEW_PATH,
      {
        replace: true,
      },
    )
  }, [
    autoConnected,
    brandId,
    callbackError,
    isPopup,
    navigate,
    pageId,
    revokedPages,
    selectBrand,
    t,
    toast,
    workspaceId,
  ])

  useEffect(() => {
    if (pages.data && !initializedSelection.current) {
      initializedSelection.current = true
      setSelected(pages.data.map((page) => page.id))
    }
  }, [pages.data])

  if (isPopup) {
    return (
      <CallbackShell>
        <div className="flex items-center justify-center gap-3 py-12 text-body-sm text-text-secondary">
          <Spin size="lg" />
          {t('oauth.completing')}
        </div>
      </CallbackShell>
    )
  }

  if (autoConnected) {
    return (
      <CallbackShell>
        <div className="flex items-center justify-center gap-3 py-12 text-body-sm text-text-secondary">
          <Spin size="lg" />
          {t('oauth.completing')}
        </div>
      </CallbackShell>
    )
  }

  const finish = async () => {
    if (!brandId || !connectionId || selected.length === 0) return
    try {
      await selectPages.mutateAsync({ brandId, connectionId, pageIds: selected })
    } catch (error) {
      toast.error({ title: errorMessage(error, t('oauth.selectError')) })
      return
    }
    if (workspaceId) selectBrand(workspaceId, brandId)
    toast.success({ title: t('oauth.connected') })
    if (revokedPages) toast.warning({ title: t('tokenHealth.revoked', { count: revokedPages }) })
    navigate(FACEBOOK_OVERVIEW_PATH, { replace: true })
  }

  if (callbackError || !brandId || !connectionId) {
    return (
      <CallbackShell>
        <SectionError
          title={t('oauth.failed')}
          retryLabel={t('oauth.back')}
          onRetry={() => navigate(FACEBOOK_OVERVIEW_PATH, { replace: true })}
        />
      </CallbackShell>
    )
  }

  if (pages.isPending) {
    return (
      <CallbackShell>
        <div className="flex items-center justify-center gap-3 py-12 text-body-sm text-text-secondary">
          <Spin size="lg" />
          {t('oauth.loadingPages')}
        </div>
      </CallbackShell>
    )
  }

  if (pages.isError) {
    return (
      <CallbackShell>
        <SectionError
          title={t('oauth.loadError')}
          retryLabel={t('common.retry')}
          onRetry={() => void pages.refetch()}
        />
      </CallbackShell>
    )
  }

  return (
    <CallbackShell>
      <div className="mb-6 flex items-center gap-3">
        <IconFacebook className="size-10 text-platform-facebook" />
        <div>
          <h1 className="text-heading-2 text-text-primary">{t('oauth.selectTitle')}</h1>
          <p className="mt-1 text-body-sm text-text-secondary">{t('oauth.selectDescription')}</p>
        </div>
      </div>

      {pages.data?.length ? (
        <div className="grid gap-2">
          {pages.data.map((page) => (
            <label
              key={page.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-subtle px-4 py-3 hover:bg-bg-surface-muted"
            >
              <Checkbox
                checked={selected.includes(page.id)}
                onChange={({ target }) =>
                  setSelected((current) =>
                    target.checked ? [...current, page.id] : current.filter((id) => id !== page.id),
                  )
                }
              />
              <span className="text-label-md text-text-primary">{page.name}</span>
            </label>
          ))}
        </div>
      ) : (
        <Alert variant="soft" tone="warning" title={t('oauth.noPages')} />
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button onClick={() => navigate(FACEBOOK_OVERVIEW_PATH, { replace: true })}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          loading={selectPages.isPending}
          disabled={selected.length === 0}
          onClick={() => void finish()}
        >
          {t('oauth.connectSelected')}
        </Button>
      </div>
    </CallbackShell>
  )
}

function CallbackShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page p-4">
      <section className="w-full max-w-xl rounded-xl border border-border-subtle bg-bg-surface p-6 shadow-lg">
        {children}
      </section>
    </main>
  )
}

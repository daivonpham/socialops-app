import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SOCIAL_ACCOUNT_QUERY_KEYS } from '@/features/social-accounts'
import { useApiErrorMessage, useUrlFilters } from '@/shared/hooks'
import { hasPermission, usePermissions } from '@/shared/permissions'
import { useActiveBrand } from '@/shared/scope'
import {
  Badge,
  Button,
  EmptyState,
  IconFacebook,
  IconSettings,
  SectionError,
  SectionSkeleton,
  Tabs,
  useToast,
} from '@/shared/ui'
import {
  useConnectFacebook,
  useFacebookIntegration,
  FACEBOOK_POST_CONTENT_TYPES,
  FACEBOOK_QUERY_KEYS,
  type DateRange,
  type FacebookPostContentType,
  type FacebookQuery,
  type FacebookTab,
} from '../api'
import { FacebookConnectionHealthBanner } from '../components/FacebookConnectionHealthBanner'
import { FacebookDisconnected } from '../components/FacebookDisconnected'
import { FacebookFilters } from '../components/FacebookFilters'
import {
  FacebookOAuthResultModal,
  type FacebookOAuthResult,
} from '../components/FacebookOAuthResultModal'
import { FacebookGrantNoticeModal, FacebookLostPagesModal } from '../components/FacebookGrantModals'
import { ManageFacebookPagesDrawer } from '../components/ManageFacebookPagesDrawer'
import { FacebookPostsTab } from '../components/FacebookPostsTab'
import { FacebookPageSwitcher } from '../components/FacebookPageSwitcher'
import { FacebookFirstSync, FacebookSyncBanner } from '../components/FacebookSyncStatus'
import { FacebookDashboard } from '../components/dashboard/FacebookDashboard'
import { FACEBOOK_ACCESS } from '../config/facebook-access'
import { CodedError, parseErrorCode } from '@/shared/api/errors'

const DEFAULT_FILTERS = {
  tab: 'overview',
  pageId: 'all',
  range: '28d',
  since: '',
  until: '',
  compare: 'previous',
  contentType: 'all',
}

export default function FacebookPage() {
  const { t } = useTranslation('facebook')
  const errorMessage = useApiErrorMessage('facebook')
  const toast = useToast()
  const queryClient = useQueryClient()
  const { brandId } = useActiveBrand()
  const integration = useFacebookIntegration(brandId)
  const connect = useConnectFacebook()
  const { granted } = usePermissions()
  const [filters, setFilters] = useUrlFilters(DEFAULT_FILTERS)
  const [isPageManagerOpen, setIsPageManagerOpen] = useState(false)
  const [oauthResult, setOauthResult] = useState<FacebookOAuthResult | null>(null)
  const [grantNoticeOpen, setGrantNoticeOpen] = useState(false)
  const [lostPages, setLostPages] = useState<string[]>([])
  const canManageConnection = hasPermission(granted, FACEBOOK_ACCESS.manageConnection[0])

  useEffect(() => {
    const receiveOAuthResult = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const message = event.data as {
        type?: string
        brandId?: string | null
        connectionId?: string | null
        autoConnected?: boolean
        pageId?: string | null
        restoredPages?: number
        revokedPages?: number
        lostPages?: string[]
        error?: string | null
      }
      if (message?.type !== 'socialops.facebook.oauth') return
      if (message.error || !message.brandId || !message.connectionId) {
        toast.error({
          title: errorMessage(
            new CodedError(parseErrorCode(message.error, 'FACEBOOK_OAUTH_FAILED')),
            t('oauth.failed'),
          ),
        })
        return
      }
      if (message.brandId !== brandId) return
      if (message.restoredPages) {
        toast.success({ title: t('tokenHealth.restored', { count: message.restoredPages }) })
        void queryClient.invalidateQueries({ queryKey: FACEBOOK_QUERY_KEYS.root(brandId) })
      }
      // Pages left unticked in the Facebook dialog lose access in every Brand using them; say
      // which, and offer logging in again right away.
      if (message.revokedPages) {
        if (message.lostPages?.length) setLostPages(message.lostPages)
        else toast.warning({ title: t('tokenHealth.revoked', { count: message.revokedPages }) })
        void queryClient.invalidateQueries({ queryKey: FACEBOOK_QUERY_KEYS.root(brandId) })
      }
      if (message.autoConnected) {
        if (message.pageId) setFilters({ tab: 'overview', pageId: message.pageId })
        toast.success({ title: t('oauth.connected') })
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: FACEBOOK_QUERY_KEYS.root(brandId) }),
          queryClient.invalidateQueries({ queryKey: SOCIAL_ACCOUNT_QUERY_KEYS.counts(brandId) }),
        ])
        return
      }
      queryClient.removeQueries({
        queryKey: FACEBOOK_QUERY_KEYS.availablePages(message.brandId, message.connectionId),
        exact: true,
      })
      setOauthResult({ brandId: message.brandId, connectionId: message.connectionId })
    }
    window.addEventListener('message', receiveOAuthResult)
    return () => window.removeEventListener('message', receiveOAuthResult)
  }, [brandId, queryClient, setFilters, t, toast])

  const startConnect = () =>
    connect.mutate(
      { brandId: brandId! },
      { onError: (error) => toast.error({ title: errorMessage(error, t('oauth.startError')) }) },
    )

  // Logging in replaces the whole Page grant: first list the Pages other Brands use.
  const otherBrandPages = integration.data?.otherBrandPages ?? []
  const requestConnect = () => {
    if (otherBrandPages.length) setGrantNoticeOpen(true)
    else startConnect()
  }

  const oauthModal = (
    <>
      <FacebookOAuthResultModal
        result={oauthResult}
        onClose={() => setOauthResult(null)}
        onConnected={() => setOauthResult(null)}
      />
      <FacebookGrantNoticeModal
        open={grantNoticeOpen}
        pages={otherBrandPages}
        loading={connect.isPending}
        onClose={() => setGrantNoticeOpen(false)}
        onContinue={() => {
          setGrantNoticeOpen(false)
          startConnect()
        }}
      />
      <FacebookLostPagesModal
        pages={lostPages}
        loading={connect.isPending}
        onClose={() => setLostPages([])}
        onReconnect={() => {
          setLostPages([])
          startConnect()
        }}
      />
    </>
  )

  if (!brandId)
    return (
      <div className="py-16">
        <EmptyState title={t('noBrand.title')} description={t('noBrand.description')} />
      </div>
    )
  if (integration.isPending)
    return (
      <div aria-label={t('common.loading')}>
        <SectionSkeleton rows={7} />
      </div>
    )
  if (integration.isError)
    return (
      <SectionError
        title={t('common.loadError')}
        retryLabel={t('common.retry')}
        onRetry={() => void integration.refetch()}
      />
    )
  if (!integration.data || integration.data.state === 'disconnected')
    return (
      <>
        <FacebookDisconnected isConnecting={connect.isPending} onConnect={requestConnect} />
        {oauthModal}
      </>
    )

  const data = integration.data
  const visiblePages = data.pages.filter((page) => page.health !== 'disconnected')
  // An expiring grant still works, so its Pages stay selectable until it actually lapses.
  const connectedPages = visiblePages.filter(
    (page) => page.health === 'connected' || page.health === 'token_expiring',
  )
  const unhealthyPages = visiblePages.filter((page) => page.health !== 'connected')
  const tab = (
    ['overview', 'posts'].includes(filters.tab) ? filters.tab : 'overview'
  ) as FacebookTab
  const selectedPageId =
    filters.pageId === 'all' || connectedPages.some((page) => page.id === filters.pageId)
      ? filters.pageId
      : 'all'
  const query: FacebookQuery = {
    pageId: selectedPageId,
    range: filters.range as DateRange,
    since: filters.since || undefined,
    until: filters.until || undefined,
    compare: filters.compare,
  }

  // The sync notices only concern the Pages on screen.
  const shownPageIds =
    selectedPageId === 'all' ? connectedPages.map((page) => page.id) : [selectedPageId]

  const contentType =
    FACEBOOK_POST_CONTENT_TYPES.find((value) => value === filters.contentType) ??
    ('all' satisfies FacebookPostContentType)

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <IconFacebook className="h-12 w-12 shrink-0 text-platform-facebook" />
          <div>
            <h1 className="text-heading-2 font-semibold text-text-primary">{t('title')}</h1>
            <p className="mt-1 text-body-sm text-text-secondary">
              {t('connection.connectedCount', { count: visiblePages.length })}
              {unhealthyPages.length
                ? ` · ${t('connection.needsReconnect', { count: unhealthyPages.length })}`
                : ''}{' '}
              · {t('subtitle')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FacebookPageSwitcher
            pages={connectedPages}
            selectedPageId={selectedPageId}
            onPageChange={(pageId) => setFilters({ pageId })}
            onAddPage={requestConnect}
            canManagePages={canManageConnection}
          />
          <span className="relative inline-flex">
            <Button
              icon={<IconSettings />}
              aria-label={
                unhealthyPages.length
                  ? t('connection.manageWithIssues', { count: unhealthyPages.length })
                  : t('connection.manage')
              }
              title={t('connection.manage')}
              onClick={() => setIsPageManagerOpen(true)}
            />
            {unhealthyPages.length ? (
              <Badge count={unhealthyPages.length} tone="danger" placement="corner" aria-hidden />
            ) : null}
          </span>
        </div>
      </header>

      <FacebookConnectionHealthBanner
        pages={visiblePages}
        canManage={canManageConnection}
        reconnecting={connect.isPending}
        onReconnect={requestConnect}
      />
      <FacebookSyncBanner brandId={brandId} pageIds={shownPageIds} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          ariaLabel={t('tabs.label')}
          onChange={(value) => setFilters({ tab: value })}
          options={[
            { value: 'overview', label: t('tabs.overview') },
            { value: 'posts', label: t('tabs.posts') },
          ]}
        />
        <div className="flex flex-wrap items-center justify-end gap-3">
          <FacebookFilters
            range={query.range}
            since={query.since}
            until={query.until}
            compare={query.compare}
            contentType={tab === 'posts' ? contentType : undefined}
            onChange={setFilters}
          />
        </div>
      </div>
      <FacebookFirstSync brandId={brandId} pageIds={shownPageIds}>
        {tab === 'overview' ? (
          <FacebookDashboard
            brandId={brandId}
            query={query}
            pages={visiblePages}
            onSelectPage={(pageId) => setFilters({ pageId })}
          />
        ) : (
          <FacebookPostsTab
            brandId={brandId}
            query={query}
            contentType={contentType}
            onClearContentType={() => setFilters({ contentType: 'all' })}
          />
        )}
      </FacebookFirstSync>
      <ManageFacebookPagesDrawer
        brandId={brandId}
        integration={{ ...data, pages: visiblePages }}
        isOpen={isPageManagerOpen}
        onClose={() => setIsPageManagerOpen(false)}
        onAddPage={requestConnect}
        isAddingPage={connect.isPending}
        canManage={canManageConnection}
      />
      {oauthModal}
    </div>
  )
}

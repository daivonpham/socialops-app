import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SOCIAL_ACCOUNT_QUERY_KEYS } from '@/features/social-accounts'
import { CodedError, parseErrorCode } from '@/shared/api/errors'
import { useApiErrorMessage, useUrlFilters } from '@/shared/hooks'
import { hasPermission, PERMISSIONS, usePermissions } from '@/shared/permissions'
import { useActiveBrand } from '@/shared/scope'
import {
  AccountSwitcher,
  AnalyticsFilters,
  Badge,
  Button,
  EmptyState,
  IconSettings,
  IconTikTok,
  SectionError,
  Spin,
  Tabs,
  useToast,
} from '@/shared/ui'
import {
  TIKTOK_QUERY_KEYS,
  useConnectTikTok,
  useTikTokIntegration,
  type TikTokQuery,
  type TikTokRange,
} from '../api'
import { ManageTikTokAccountsDrawer } from '../components/ManageTikTokAccountsDrawer'
import { TikTokConnectionHealthBanner } from '../components/TikTokConnectionHealthBanner'
import { TikTokDisconnected } from '../components/TikTokDisconnected'
import {
  TikTokFirstSync,
  TikTokSyncBanner,
  useRefreshOnTikTokSync,
} from '../components/TikTokSyncStatus'
import { TikTokVideosTab } from '../components/TikTokVideosTab'
import { TikTokDashboard } from '../components/dashboard/TikTokDashboard'

const DEFAULT_FILTERS = {
  tab: 'overview',
  accountId: 'all',
  range: '28d',
  since: '',
  until: '',
  compare: 'previous',
}

type TikTokTab = 'overview' | 'videos'

export default function TikTokPage() {
  const { t } = useTranslation('tiktok')
  const errorMessage = useApiErrorMessage('tiktok')
  const toast = useToast()
  const queryClient = useQueryClient()
  const { brandId } = useActiveBrand()
  const integration = useTikTokIntegration(brandId)
  const connect = useConnectTikTok()
  const { granted } = usePermissions()
  const [filters, setFilters] = useUrlFilters(DEFAULT_FILTERS)
  const [isManagerOpen, setIsManagerOpen] = useState(false)
  const canManage = hasPermission(granted, PERMISSIONS.CHANNELS_MANAGE.key)
  useRefreshOnTikTokSync(brandId ?? '', integration.data?.accounts ?? [])

  useEffect(() => {
    const receiveResult = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const result = event.data as {
        type?: string
        brandId?: string
        accountId?: string
        missingScopes?: string | null
        error?: string | null
      }
      if (result?.type !== 'socialops.tiktok.oauth') return
      if (result.error === 'TIKTOK_OAUTH_CANCELLED') {
        toast.info({ title: t('oauth.cancelled') })
        return
      }
      if (result.error) {
        toast.error({
          title: errorMessage(
            new CodedError(parseErrorCode(result.error, 'TIKTOK_OAUTH_FAILED')),
            t('oauth.failed'),
          ),
        })
        return
      }
      if (result.brandId !== brandId || !result.accountId) return
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: TIKTOK_QUERY_KEYS.root(brandId) }),
        queryClient.invalidateQueries({ queryKey: SOCIAL_ACCOUNT_QUERY_KEYS.counts(brandId) }),
      ])
      if (result.missingScopes) toast.warning({ title: t('oauth.missingScopes') })
      else toast.success({ title: t('oauth.connected') })
      setFilters({ tab: 'overview', accountId: result.accountId })
    }
    window.addEventListener('message', receiveResult)
    return () => window.removeEventListener('message', receiveResult)
  }, [brandId, errorMessage, queryClient, setFilters, t, toast])

  const startConnect = () =>
    connect.mutate(brandId!, {
      onError: (error) => toast.error({ title: errorMessage(error, t('oauth.startError')) }),
    })

  if (!brandId)
    return (
      <div className="py-16">
        <EmptyState title={t('noBrand.title')} description={t('noBrand.description')} />
      </div>
    )
  if (integration.isPending)
    return (
      <div role="status" aria-label={t('common.loading')} className="flex justify-center py-16">
        <Spin size="lg" />
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
      <TikTokDisconnected
        canConnect={canManage}
        isConnecting={connect.isPending}
        onConnect={startConnect}
      />
    )

  const data = integration.data
  const accounts = data.accounts
  const unhealthy = accounts.filter((account) => account.health !== 'connected')
  const tab: TikTokTab = filters.tab === 'videos' ? 'videos' : 'overview'
  const accountId =
    filters.accountId === 'all' || accounts.some((account) => account.id === filters.accountId)
      ? filters.accountId
      : 'all'
  const query: TikTokQuery = {
    accountId,
    range: (['7d', '28d', '30d', '90d'].includes(filters.range)
      ? filters.range
      : '28d') as TikTokRange,
    since: filters.since || undefined,
    until: filters.until || undefined,
    compare: filters.compare,
  }
  const shown = accountId === 'all' ? accounts : accounts.filter((a) => a.id === accountId)

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <IconTikTok className="h-12 w-12 shrink-0 text-platform-tiktok" />
          <div>
            <h1 className="text-heading-2 font-semibold text-text-primary">{t('title')}</h1>
            <p className="mt-1 text-body-sm text-text-secondary">
              {t('connection.connectedCount', { count: accounts.length })}
              {unhealthy.length
                ? ` · ${t('connection.needsReconnect', { count: unhealthy.length })}`
                : ''}{' '}
              · {t('subtitle')}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AccountSwitcher
            accounts={accounts}
            selectedId={accountId}
            allLabel={t('common.allAccounts')}
            platformIcon={<IconTikTok className="text-platform-tiktok" />}
            searchPlaceholder={t('connection.searchAccounts')}
            ariaLabel={t('connection.accountSwitcherLabel')}
            addLabel={canManage ? t('connection.addAccount') : undefined}
            onChange={(next) => setFilters({ accountId: next })}
            onAdd={startConnect}
          />
          <span className="relative inline-flex">
            <Button
              icon={<IconSettings />}
              aria-label={
                unhealthy.length
                  ? t('connection.manageWithIssues', { count: unhealthy.length })
                  : t('connection.manage')
              }
              title={t('connection.manage')}
              onClick={() => setIsManagerOpen(true)}
            />
            {unhealthy.length ? (
              <Badge count={unhealthy.length} tone="danger" placement="corner" aria-hidden />
            ) : null}
          </span>
        </div>
      </header>

      <TikTokConnectionHealthBanner
        accounts={accounts}
        canManage={canManage}
        reconnecting={connect.isPending}
        onReconnect={startConnect}
      />
      <TikTokSyncBanner accounts={shown} />

      {/* The view tabs get a row of their own until the filters fit beside them (1280px). */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <Tabs
          value={tab}
          ariaLabel={t('tabs.label')}
          onChange={(value) => setFilters({ tab: value })}
          options={[
            { value: 'overview', label: t('tabs.overview') },
            { value: 'videos', label: t('tabs.videos') },
          ]}
        />
        <div className="flex min-w-0 xl:justify-end">
          <AnalyticsFilters
            includeToday
            range={query.range}
            since={query.since}
            until={query.until}
            compare={query.compare}
            onChange={setFilters}
          />
        </div>
      </div>
      <TikTokFirstSync accounts={shown}>
        {tab === 'overview' ? (
          <TikTokDashboard
            brandId={brandId}
            query={query}
            accounts={accounts}
            onSelectAccount={(next) => setFilters({ accountId: next })}
          />
        ) : (
          <TikTokVideosTab brandId={brandId} query={query} />
        )}
      </TikTokFirstSync>
      <ManageTikTokAccountsDrawer
        brandId={brandId}
        integration={data}
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onAddAccount={startConnect}
        isAddingAccount={connect.isPending}
        canManage={canManage}
      />
    </div>
  )
}

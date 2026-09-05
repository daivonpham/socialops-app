import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUrlFilters } from '@/shared/hooks'
import { hasPermission, usePermissions } from '@/shared/permissions'
import { useActiveBrand } from '@/shared/scope'
import {
  Badge,
  Button,
  IconFacebook,
  IconSettings,
  SectionError,
  SectionSkeleton,
  Tabs,
} from '@/shared/ui'
import {
  useConnectFacebook,
  useFacebookIntegration,
  type DateRange,
  type FacebookQuery,
  type FacebookTab,
} from '../api'
import { AnalyticsTab } from '../components/AnalyticsTab'
import { FacebookDisconnected } from '../components/FacebookDisconnected'
import { FacebookFilters } from '../components/FacebookFilters'
import { ManageFacebookPagesDrawer } from '../components/ManageFacebookPagesDrawer'
import { FacebookPageSwitcher } from '../components/FacebookPageSwitcher'
import { OverviewTab } from '../components/OverviewTab'
import { FACEBOOK_ACCESS } from '../config/facebook-access'

const DEFAULT_FILTERS = {
  tab: 'overview',
  pageId: 'all',
  range: '30d',
  compare: 'previous',
}

export default function FacebookPage() {
  const { t } = useTranslation('facebook')
  const { brandId } = useActiveBrand()
  const integration = useFacebookIntegration(brandId)
  const connect = useConnectFacebook(brandId)
  const { granted } = usePermissions()
  const [filters, setFilters] = useUrlFilters(DEFAULT_FILTERS)
  const [isPageManagerOpen, setIsPageManagerOpen] = useState(false)
  const canManageConnection = hasPermission(granted, FACEBOOK_ACCESS.manageConnection[0])

  if (!brandId) return null
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
    return <FacebookDisconnected brandId={brandId} />

  const data = integration.data
  const unhealthyPages = data.pages.filter((page) => page.health !== 'connected')
  const tab = (
    ['overview', 'analytics'].includes(filters.tab) ? filters.tab : 'overview'
  ) as FacebookTab
  const selectedPageId =
    filters.pageId === 'all' || data.pages.some((page) => page.id === filters.pageId)
      ? filters.pageId
      : 'all'
  const query: FacebookQuery = {
    pageId: selectedPageId,
    range: filters.range as DateRange,
    compare: filters.compare,
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <IconFacebook className="h-12 w-12 shrink-0 text-platform-facebook" />
          <div>
            <h1 className="text-heading-2 font-semibold text-text-primary">{t('title')}</h1>
            <p className="mt-1 text-body-sm text-text-secondary">
              {t('connection.connectedCount', { count: data.pages.length })} · {t('subtitle')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FacebookPageSwitcher
            pages={data.pages}
            selectedPageId={selectedPageId}
            onPageChange={(pageId) => setFilters({ pageId })}
            onAddPage={() => connect.mutate({ brandId })}
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          ariaLabel={t('tabs.label')}
          onChange={(value) => setFilters({ tab: value })}
          options={[
            { value: 'overview', label: t('tabs.overview') },
            { value: 'analytics', label: t('tabs.analytics') },
          ]}
        />
        <FacebookFilters range={query.range} compare={query.compare} onChange={setFilters} />
      </div>
      {tab === 'overview' ? <OverviewTab brandId={brandId} query={query} /> : null}
      {tab === 'analytics' ? <AnalyticsTab brandId={brandId} query={query} /> : null}
      <ManageFacebookPagesDrawer
        brandId={brandId}
        integration={data}
        isOpen={isPageManagerOpen}
        onClose={() => setIsPageManagerOpen(false)}
        onAddPage={() => connect.mutate({ brandId })}
        isAddingPage={connect.isPending}
      />
    </div>
  )
}

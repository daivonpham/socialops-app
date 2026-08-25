import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUrlFilters } from '@/shared/hooks'
import { useActiveBrand } from '@/shared/scope'
import {
  Alert,
  Button,
  IconFacebook,
  IconPlus,
  IconSettings,
  SectionError,
  SectionSkeleton,
  Tabs,
} from '@/shared/ui'
import {
  useFacebookIntegration,
  type DateRange,
  type FacebookQuery,
  type FacebookTab,
} from '../api'
import { AnalyticsTab } from '../components/AnalyticsTab'
import { FacebookDisconnected, FacebookPagePicker } from '../components/FacebookConnection'
import { FacebookFilters } from '../components/FacebookFilters'
import { FacebookPageManager } from '../components/FacebookPageManager'
import { OverviewTab } from '../components/OverviewTab'

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
  const [filters, setFilters] = useUrlFilters(DEFAULT_FILTERS)
  const [managerOpen, setManagerOpen] = useState(false)
  const [addingPages, setAddingPages] = useState(false)

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
  if (integration.data.state === 'needs_page_selection' || addingPages)
    return (
      <FacebookPagePicker
        brandId={brandId}
        onCancel={addingPages ? () => setAddingPages(false) : undefined}
      />
    )

  const data = integration.data
  const unhealthy = data.pages.filter((page) => page.health !== 'connected')
  const tab = (
    ['overview', 'analytics'].includes(filters.tab) ? filters.tab : 'overview'
  ) as FacebookTab
  const query: FacebookQuery = {
    pageId: filters.pageId,
    range: filters.range as DateRange,
    compare: filters.compare,
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-info-50 text-xl text-platform-facebook">
            <IconFacebook />
          </div>
          <div>
            <h1 className="text-heading-2 font-semibold text-text-primary">{t('title')}</h1>
            <p className="mt-1 text-body-sm text-text-secondary">
              {t('connection.connectedCount', { count: data.pages.length })} · {t('subtitle')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={<IconSettings />} onClick={() => setManagerOpen(true)}>
            {t('connection.manage')}
          </Button>
          <Button variant="primary" icon={<IconPlus />} onClick={() => setAddingPages(true)}>
            {t('connection.addPage')}
          </Button>
        </div>
      </header>
      {unhealthy.length ? (
        <Alert
          tone="warning"
          title={t('connection.issueBanner', { count: unhealthy.length })}
          action={
            <Button size="sm" onClick={() => setManagerOpen(true)}>
              {t('connection.reviewIssue')}
            </Button>
          }
        />
      ) : null}
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
      </div>
      <FacebookFilters
        pages={data.pages}
        pageId={query.pageId}
        range={query.range}
        compare={query.compare}
        onChange={setFilters}
      />
      {tab === 'overview' ? <OverviewTab brandId={brandId} query={query} /> : null}
      {tab === 'analytics' ? <AnalyticsTab brandId={brandId} query={query} /> : null}
      <FacebookPageManager
        brandId={brandId}
        integration={data}
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        onAdd={() => {
          setManagerOpen(false)
          setAddingPages(true)
        }}
      />
    </div>
  )
}

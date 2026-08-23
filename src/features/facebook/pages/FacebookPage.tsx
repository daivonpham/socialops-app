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
  type FacebookPostQuery,
  type FacebookQuery,
  type FacebookTab,
} from '../api'
import { AnalyticsTab } from '../components/AnalyticsTab'
import { FacebookDisconnected, FacebookPagePicker } from '../components/FacebookConnection'
import { FacebookFilters } from '../components/FacebookFilters'
import { FacebookPageManager } from '../components/FacebookPageManager'
import { OverviewTab } from '../components/OverviewTab'
import { PostsTab } from '../components/PostsTab'

const DEFAULT_FILTERS = {
  tab: 'overview',
  pageId: 'all',
  range: '30d',
  compare: 'previous',
  status: 'all',
  keyword: '',
  postPage: '1',
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
    ['overview', 'posts', 'analytics'].includes(filters.tab) ? filters.tab : 'overview'
  ) as FacebookTab
  const query: FacebookQuery = {
    pageId: filters.pageId,
    range: filters.range as DateRange,
    compare: filters.compare,
  }
  const postQuery: FacebookPostQuery = {
    ...query,
    status: filters.status,
    keyword: filters.keyword,
    page: Number(filters.postPage) || 1,
  }
  const updatePostFilters = (
    patch: Partial<Record<'pageId' | 'status' | 'keyword' | 'page', string>>,
  ) => {
    const next: Partial<typeof DEFAULT_FILTERS> = {}
    if (patch.pageId !== undefined) next.pageId = patch.pageId
    if (patch.status !== undefined) next.status = patch.status
    if (patch.keyword !== undefined) next.keyword = patch.keyword
    if (patch.page !== undefined) next.postPage = patch.page
    setFilters(next)
  }

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-info-50 text-icon-lg text-platform-facebook">
            <IconFacebook />
          </span>
          <div>
            <h1 className="text-heading-1 text-text-primary">{t('title')}</h1>
            <p className="mt-1 text-body-sm text-text-tertiary">{t('subtitle')}</p>
            <p className="mt-2 text-label-sm text-text-secondary">
              {t('connection.connectedCount', { count: data.pages.length })}
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
      <Tabs
        value={tab}
        ariaLabel={t('tabs.label')}
        onChange={(value) => setFilters({ tab: value })}
        options={[
          { value: 'overview', label: t('tabs.overview') },
          { value: 'posts', label: t('tabs.posts') },
          { value: 'analytics', label: t('tabs.analytics') },
        ]}
      />
      <FacebookFilters
        pages={data.pages}
        pageId={query.pageId}
        range={query.range}
        compare={query.compare}
        onChange={setFilters}
      />
      {tab === 'overview' ? <OverviewTab brandId={brandId} query={query} /> : null}
      {tab === 'posts' ? (
        <PostsTab
          brandId={brandId}
          integration={data}
          query={postQuery}
          onChange={updatePostFilters}
        />
      ) : null}
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

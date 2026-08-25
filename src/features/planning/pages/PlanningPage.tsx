import { useTranslation } from 'react-i18next'
import {
  useFacebookIntegration,
  type FacebookPostQuery,
  type PostStatus,
} from '@/features/facebook'
import { useUrlFilters } from '@/shared/hooks'
import { useActiveBrand } from '@/shared/scope'
import { Button, EmptyState, IconFacebook } from '@/shared/ui'
import { FacebookPostsPanel } from '../components/FacebookPostsPanel'

const DEFAULT_FILTERS = {
  pageId: 'all',
  status: 'all',
  keyword: '',
  page: '1',
}
const POST_STATUSES: PostStatus[] = ['draft', 'scheduled', 'publishing', 'published', 'failed']

export default function PlanningPage() {
  const { t } = useTranslation('planning')
  const { brandId } = useActiveBrand()
  const integration = useFacebookIntegration(brandId)
  const [filters, setFilters] = useUrlFilters(DEFAULT_FILTERS)

  if (!brandId) {
    return (
      <PlanningState
        title={t('states.noBrandTitle')}
        description={t('states.noBrandDescription')}
      />
    )
  }
  if (integration.isPending) {
    return (
      <PlanningState
        title={t('states.loadingTitle')}
        description={t('states.loadingDescription')}
      />
    )
  }
  if (integration.isError) {
    return (
      <PlanningState
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        action={<Button onClick={() => void integration.refetch()}>{t('states.retry')}</Button>}
      />
    )
  }
  if (!integration.data || integration.data.state === 'disconnected') {
    return (
      <PlanningState
        title={t('states.disconnectedTitle')}
        description={t('states.disconnectedDescription')}
      />
    )
  }
  if (integration.data.state === 'needs_page_selection') {
    return (
      <PlanningState
        title={t('states.selectionTitle')}
        description={t('states.selectionDescription')}
      />
    )
  }

  const parsedPage = Number.parseInt(filters.page, 10)
  const query: FacebookPostQuery = {
    pageId: filters.pageId,
    status:
      filters.status === 'all' || POST_STATUSES.includes(filters.status as PostStatus)
        ? filters.status
        : 'all',
    keyword: filters.keyword,
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  }

  return (
    <div className="grid gap-6">
      <header className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-info-50 text-xl text-platform-facebook">
          <IconFacebook />
        </div>
        <div>
          <h1 className="text-heading-2 font-semibold text-text-primary">{t('title')}</h1>
          <p className="mt-1 text-body-sm text-text-secondary">{t('description')}</p>
        </div>
      </header>
      <FacebookPostsPanel
        brandId={brandId}
        integration={integration.data}
        query={query}
        onChange={setFilters}
      />
    </div>
  )
}

function PlanningState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="py-8 md:py-16">
      <EmptyState title={title} description={description} action={action} />
    </div>
  )
}

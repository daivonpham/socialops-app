import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useSocialAccountCounts } from '@/features/social-accounts'
import { useUrlFilters } from '@/shared/hooks'
import { useActiveBrand } from '@/shared/scope'
import { EmptyState, IconCalendar, SectionError, SectionSkeleton, Tabs } from '@/shared/ui'
import {
  usePlanningContents,
  type PlanningContent,
  type PlanningPlatform,
  type PlanningQuery,
  type PlanningStatus,
} from '../api'
import {
  PLANNING_FILTER_DEFAULTS,
  persistPreferredPlanningView,
  readPreferredPlanningView,
  type PlanningCalendarView,
  type PlanningView,
} from '../config/planning.filters'
import { PLANNING_STATUS_META, type PlanningAccount } from '../model'

import { CreatePostButton } from '../components/CreatePostButton'
import { PlanningCalendar } from '../components/PlanningCalendar'
import { PlanningFilters } from '../components/PlanningFilters'
import { PlanningList } from '../components/PlanningList'
import { PlanningPostDrawer } from '../components/PlanningPostDrawer'

export default function PlanningPage() {
  const { t } = useTranslation('planning')
  const { brandId } = useActiveBrand()
  const { platform: routePlatformParam } = useParams<{ platform: string }>()

  const routePlatform = isPlanningPlatform(routePlatformParam) ? routePlatformParam : 'all'
  const [preferredView] = useState(readPreferredPlanningView)
  const planningFilterDefaults = useMemo(
    () => ({ ...PLANNING_FILTER_DEFAULTS, view: preferredView }),
    [preferredView],
  )
  const [urlFilters, setUrlFilters] = useUrlFilters(planningFilterDefaults)
  const [selectedContent, setSelectedContent] = useState<PlanningContent | null>(null)

  const view = isPlanningView(urlFilters.view) ? urlFilters.view : preferredView
  const calendarView = isPlanningCalendarView(urlFilters.calendarView)
    ? urlFilters.calendarView
    : 'month'
  const selectedDate = isDateKey(urlFilters.date) ? urlFilters.date : PLANNING_FILTER_DEFAULTS.date
  const platform = routePlatform
  const status = isPlanningStatus(urlFilters.status) ? urlFilters.status : 'all'
  const query: PlanningQuery = {
    platform,
    accountId: urlFilters.accountId || 'all',
    status,
  }
  const catalogQuery = usePlanningContents(brandId, {
    platform: 'all',
    accountId: 'all',
    status: 'all',
  })
  const contentsQuery = usePlanningContents(brandId, query)
  const accountCounts = useSocialAccountCounts(brandId)
  const accounts = useMemo(
    () => collectAccounts(catalogQuery.data?.items ?? []),
    [catalogQuery.data],
  )
  const contents = contentsQuery.data?.items ?? []

  if (!brandId) {
    return (
      <PlanningState
        title={t('states.noBrandTitle')}
        description={t('states.noBrandDescription')}
      />
    )
  }
  if (catalogQuery.isPending || contentsQuery.isPending || accountCounts.isPending) {
    return (
      <div className="grid gap-6" aria-label={t('states.loadingTitle')}>
        <SectionSkeleton rows={2} />
        <SectionSkeleton rows={8} />
      </div>
    )
  }
  if (catalogQuery.isError || contentsQuery.isError || accountCounts.isError) {
    return (
      <SectionError
        title={t('states.errorTitle')}
        retryLabel={t('states.retry')}
        onRetry={() => {
          void catalogQuery.refetch()
          void contentsQuery.refetch()
          void accountCounts.refetch()
        }}
      />
    )
  }
  const connectedAccountCount = accountCounts.data
    ? accountCounts.data.facebook + accountCounts.data.tiktok
    : 0
  if (connectedAccountCount === 0) {
    return (
      <PlanningState
        icon={<IconCalendar />}
        title={t('states.noAccountsTitle')}
        description={t('states.noAccountsDescription')}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={view}
          ariaLabel={t('tabs.ariaLabel')}
          onChange={(nextView) => {
            if (!isPlanningView(nextView)) return
            persistPreferredPlanningView(nextView)
            setUrlFilters({ view: nextView })
          }}
          options={[
            { value: 'calendar', label: t('tabs.calendar') },
            { value: 'list', label: t('tabs.list') },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <PlanningFilters
            accounts={accounts}
            platform={platform}
            accountId={query.accountId}
            status={status}
            onChange={(filters) => setUrlFilters(filters)}
          />
          <CreatePostButton accounts={accounts} platform={platform} />
        </div>
      </div>

      {contents.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-bg-surface py-12">
          <EmptyState title={t('states.emptyTitle')} description={t('states.emptyDescription')} />
        </div>
      ) : view === 'calendar' ? (
        <PlanningCalendar
          brandId={brandId}
          contents={contents}
          calendarView={calendarView}
          selectedDate={selectedDate}
          onCalendarViewChange={(nextView) => setUrlFilters({ calendarView: nextView })}
          onDateChange={(date) => setUrlFilters({ date })}
          onSelectContent={setSelectedContent}
        />
      ) : (
        <PlanningList contents={contents} onSelectContent={setSelectedContent} />
      )}

      <PlanningPostDrawer content={selectedContent} onClose={() => setSelectedContent(null)} />
    </div>
  )
}

function PlanningState({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="py-8 md:py-16">
      <EmptyState icon={icon} title={title} description={description} />
    </div>
  )
}

function collectAccounts(contents: PlanningContent[]): PlanningAccount[] {
  const accounts = new Map<string, PlanningAccount>()
  for (const content of contents) {
    for (const target of content.targets) {
      accounts.set(`${content.platform}:${target.id}`, { ...target, platform: content.platform })
    }
  }
  return [...accounts.values()]
}

function isPlanningPlatform(value: string | undefined): value is PlanningPlatform {
  return value === 'facebook' || value === 'tiktok'
}

function isPlanningView(value: string): value is PlanningView {
  return value === 'calendar' || value === 'list'
}

function isPlanningCalendarView(value: string): value is PlanningCalendarView {
  return value === 'month' || value === 'week'
}

function isPlanningStatus(value: string): value is 'all' | PlanningStatus {
  return value === 'all' || value in PLANNING_STATUS_META
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime())
}

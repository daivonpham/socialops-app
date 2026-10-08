import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useSocialAccountCounts } from '@/features/social-accounts'
import { useUrlFilters } from '@/shared/hooks'
import { hasPermission, usePermissions } from '@/shared/permissions'
import { useActiveBrand } from '@/shared/scope'
import {
  Button,
  EmptyState,
  IconCalendar,
  SectionError,
  SectionSkeleton,
  Tabs,
  useToast,
} from '@/shared/ui'
import {
  usePlanningContents,
  usePlanningContent,
  usePlanningAccounts,
  useCancelPlanningContent,
  useRetryPlanningPublication,
  useRetryFailedPlanningPublications,
  useEditPublishedPlanningCaption,
  useDeletePublishedPlanningPublication,
  type PlanningContent,
  type PlanningRetryResult,
  type PlanningApprovalStatus,
  type PlanningPlatform,
  type PlanningPostType,
  type PlanningQuery,
} from '../api'
import {
  PLANNING_FILTER_DEFAULTS,
  PLANNING_FILTER_STATUS_GROUPS,
  type PlanningStatusGroup,
  persistPreferredPlanningView,
  readPreferredPlanningView,
  type PlanningCalendarView,
  type PlanningView,
} from '../config/planning.filters'
import { PLANNING_ACCESS } from '../config/planning-access'
import { getPlanningCreatePath, getPlanningEditPath } from '../config/planning.routes'

import { CreatePostButton } from '../components/CreatePostButton'
import { PlanningCalendar } from '../components/PlanningCalendar'
import { PlanningFilters } from '../components/PlanningFilters'
import { PlanningList } from '../components/PlanningList'
import { PlanningPostModal } from '../components/PlanningPostDrawer'

export default function PlanningPage() {
  const { t } = useTranslation('planning')
  const toast = useToast()
  const navigate = useNavigate()
  const { brandId } = useActiveBrand()
  const { granted } = usePermissions()
  const { platform: routePlatformParam } = useParams<{ platform: string }>()

  const routePlatform = isPlanningPlatform(routePlatformParam) ? routePlatformParam : 'all'
  const [preferredView] = useState(readPreferredPlanningView)
  const planningFilterDefaults = useMemo(
    () => ({ ...PLANNING_FILTER_DEFAULTS, view: preferredView }),
    [preferredView],
  )
  const [urlFilters, setUrlFilters] = useUrlFilters(planningFilterDefaults)
  const [selectedContent, setSelectedContent] = useState<PlanningContent | null>(null)
  const [retryResults, setRetryResults] = useState<PlanningRetryResult[]>([])

  const view = isPlanningView(urlFilters.view) ? urlFilters.view : preferredView
  const calendarView = isPlanningCalendarView(urlFilters.calendarView)
    ? urlFilters.calendarView
    : 'month'
  const selectedDate = isDateKey(urlFilters.date) ? urlFilters.date : PLANNING_FILTER_DEFAULTS.date
  const platform = routePlatform
  const statusGroup = isPlanningStatusGroup(urlFilters.statusGroup) ? urlFilters.statusGroup : 'all'
  const type = isPlanningPostType(urlFilters.type) ? urlFilters.type : 'all'
  const attention = urlFilters.attention === 'needs_action' ? 'needs_action' : 'all'
  const approvalStatus = isPlanningApprovalStatus(urlFilters.approvalStatus)
    ? urlFilters.approvalStatus
    : 'all'
  const query: PlanningQuery = {
    platform,
    type,
    accountId: urlFilters.accountId || 'all',
    statusGroup,
    attention,
    approvalStatus,
  }
  const hasActiveFilters =
    query.accountId !== 'all' ||
    type !== 'all' ||
    statusGroup !== 'all' ||
    attention !== 'all' ||
    approvalStatus !== 'all'
  const clearFilters = () =>
    setUrlFilters({
      accountId: 'all',
      type: 'all',
      statusGroup: 'all',
      attention: 'all',
      approvalStatus: 'all',
    })
  const accountsQuery = usePlanningAccounts(brandId)
  const contentsQuery = usePlanningContents(brandId, query)
  const selectedContentQuery = usePlanningContent(brandId, selectedContent?.id ?? null)
  useEffect(() => {
    if (selectedContentQuery.data) setSelectedContent(selectedContentQuery.data)
  }, [selectedContentQuery.data])
  const accountCounts = useSocialAccountCounts(brandId)
  const cancelContent = useCancelPlanningContent(brandId)
  const retryPublication = useRetryPlanningPublication(brandId)
  const retryFailed = useRetryFailedPlanningPublications(brandId)
  const editPublishedCaption = useEditPublishedPlanningCaption(brandId)
  const deletePublished = useDeletePublishedPlanningPublication(brandId)
  const accounts = accountsQuery.data ?? []
  const createPlatform =
    platform === 'all' ? accounts.find((account) => account.platform)?.platform : platform
  const canCreatePost = hasPermission(granted, PLANNING_ACCESS.publish[0])
  const contents = contentsQuery.data?.items ?? []
  const editContent = useCallback(
    (content: PlanningContent) => {
      setSelectedContent(null)
      navigate(getPlanningEditPath(content.platform, content.id))
    },
    [navigate],
  )

  if (!brandId) {
    return (
      <PlanningState
        title={t('states.noBrandTitle')}
        description={t('states.noBrandDescription')}
      />
    )
  }
  if (accountsQuery.isPending || contentsQuery.isPending || accountCounts.isPending) {
    return (
      <div className="grid gap-6" aria-label={t('states.loadingTitle')}>
        <SectionSkeleton rows={2} />
        <SectionSkeleton rows={8} />
      </div>
    )
  }
  if (accountsQuery.isError || contentsQuery.isError || accountCounts.isError) {
    return (
      <SectionError
        title={t('states.errorTitle')}
        retryLabel={t('states.retry')}
        onRetry={() => {
          void accountsQuery.refetch()
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
            statusGroup={statusGroup}
            type={type}
            attention={attention}
            approvalStatus={approvalStatus}
            onChange={(filters) => setUrlFilters(filters)}
          />
          <CreatePostButton accounts={accounts} platform={platform} />
        </div>
      </div>

      {view === 'calendar' && contents.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-bg-surface py-12">
          <EmptyState
            title={t('states.emptyTitle')}
            description={t('states.emptyDescription')}
            action={
              hasActiveFilters ? (
                <Button onClick={clearFilters}>{t('filters.clear')}</Button>
              ) : undefined
            }
          />
        </div>
      ) : view === 'calendar' ? (
        <PlanningCalendar
          brandId={brandId}
          contents={contents}
          createPlatform={canCreatePost ? createPlatform : undefined}
          calendarView={calendarView}
          selectedDate={selectedDate}
          onCalendarViewChange={(nextView) => setUrlFilters({ calendarView: nextView })}
          onDateChange={(date) => setUrlFilters({ date })}
          onSelectContent={setSelectedContent}
          onCreatePost={(date, postType) => {
            if (!createPlatform) return
            navigate(getPlanningCreatePath(createPlatform, { date, postType }))
          }}
        />
      ) : (
        <PlanningList
          brandId={brandId}
          contents={contents}
          statusGroup={statusGroup}
          approvalStatus={approvalStatus}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          onFiltersChange={setUrlFilters}
          onSelectContent={setSelectedContent}
          onEditContent={editContent}
        />
      )}

      <PlanningPostModal
        content={selectedContent}
        retryResults={retryResults}
        onClose={() => {
          setSelectedContent(null)
          setRetryResults([])
        }}
        onEdit={editContent}
        onCancelContent={async (content) => {
          if (!brandId) return
          try {
            await cancelContent.mutateAsync({ brandId, contentId: content.id })
            setSelectedContent(null)
            toast.success({ title: t('detail.cancelSuccess') })
          } catch {
            toast.error({ title: t('detail.cancelError') })
          }
        }}
        onRetryPublication={async (publicationId) => {
          if (!brandId) return
          try {
            const response = await retryPublication.mutateAsync({ brandId, publicationId })
            setSelectedContent(response.data)
            toast.success({ title: t('detail.retrySuccess') })
          } catch {
            toast.error({ title: t('detail.retryError') })
          }
        }}
        onRetryFailed={async (contentId) => {
          if (!brandId) return
          try {
            const response = await retryFailed.mutateAsync({ brandId, contentId })
            setSelectedContent(response.data.content)
            setRetryResults(response.data.results)
            const queued = response.data.results.filter((item) => item.outcome === 'queued').length
            if (queued) toast.success({ title: t('detail.retryAllResult', { queued }) })
            else toast.error({ title: t('detail.retryNone') })
          } catch {
            toast.error({ title: t('detail.retryError') })
          }
        }}
        onEditPublishedCaption={async (publicationId, caption) => {
          if (!brandId) return
          try {
            const response = await editPublishedCaption.mutateAsync({
              brandId,
              publicationId,
              caption,
            })
            setSelectedContent(response.data)
            toast.success({ title: t('detail.editPublishedSuccess') })
          } catch {
            toast.error({ title: t('detail.editPublishedError') })
          }
        }}
        onDeletePublished={async (publicationId) => {
          if (!brandId) return
          try {
            const response = await deletePublished.mutateAsync({ brandId, publicationId })
            setSelectedContent(
              ['cancelled', 'deleted'].includes(response.data.status) ? null : response.data,
            )
            toast.success({ title: t('detail.deletePublishedSuccess') })
          } catch {
            toast.error({ title: t('detail.deletePublishedError') })
          }
        }}
      />
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

function isPlanningPlatform(value: string | undefined): value is PlanningPlatform {
  return value === 'facebook' || value === 'tiktok'
}

function isPlanningView(value: string): value is PlanningView {
  return value === 'calendar' || value === 'list'
}

function isPlanningCalendarView(value: string): value is PlanningCalendarView {
  return value === 'month' || value === 'week'
}

function isPlanningStatusGroup(value: string): value is 'all' | PlanningStatusGroup {
  return value === 'all' || PLANNING_FILTER_STATUS_GROUPS.includes(value as PlanningStatusGroup)
}

function isPlanningPostType(value: string): value is 'all' | PlanningPostType {
  return [
    'all',
    'facebook_feed',
    'facebook_story',
    'facebook_reel',
    'tiktok_video',
    'tiktok_photo',
  ].includes(value)
}

function isPlanningApprovalStatus(value: string): value is 'all' | PlanningApprovalStatus {
  return (
    value === 'all' ||
    value === 'none' ||
    value === 'pending' ||
    value === 'approved' ||
    value === 'rejected'
  )
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime())
}

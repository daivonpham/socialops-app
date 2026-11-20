import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AiCreateButton } from '@/features/ai-content'
import { useReconnectFacebookPages } from '@/features/facebook'
import { useSocialAccountCounts } from '@/features/social-accounts'
import { isApiErrorCode } from '@/shared/api/errors'
import { useApiErrorMessage, useUrlFilters } from '@/shared/hooks'
import { hasPermission, PERMISSIONS, usePermissions } from '@/shared/permissions'
import { useActiveBrand } from '@/shared/scope'
import {
  EmptyState,
  IconCalendar,
  Pagination,
  SectionError,
  SectionSkeleton,
  Tabs,
  useToast,
} from '@/shared/ui'
import {
  PLANNING_QUERY_KEYS,
  usePlanningCalendarContents,
  usePlanningContentPage,
  usePlanningContent,
  usePlanningAccounts,
  useCancelPlanningContent,
  useRetryPlanningPublication,
  useRetryFailedPlanningPublications,
  useDeletePublishedPlanningPublication,
  useDiscardUnknownPlanningPublication,
  useDeleteAllPlanningPublications,
  useReconcileUnknownPlanningPublications,
  useEditPublishedPlanningCaption,
  useDismissUnknownPlanningEdit,
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
  getPlanningTodayDateKey,
  type PlanningStatusGroup,
  persistPreferredPlanningView,
  readPreferredPlanningView,
  type PlanningCalendarView,
  type PlanningView,
} from '../config/planning.filters'
import { PLANNING_ACCESS } from '../config/planning-access'
import { canPublishOnPlatform } from '../config/planning-capabilities'
import { getPlanningCreatePath, getPlanningEditPath } from '../config/planning.routes'

import { CreatePostButton } from '../components/CreatePostButton'
import { PlanningCalendar } from '../components/PlanningCalendar'
import { PlanningFilters } from '../components/PlanningFilters'
import { PlanningList } from '../components/PlanningList'
import { PlanningPostModal } from '../components/PlanningPostDrawer'
import { planningCalendarWindows } from '../model/calendar-window'

/** Failures that reconnecting the Page fixes; their toast offers to reconnect it. */
const FACEBOOK_RECONNECT_CODES = [
  'FACEBOOK_RECONNECT_REQUIRED',
  'FACEBOOK_REAUTHORIZATION_REQUIRED',
  'FACEBOOK_TOKEN_EXPIRED',
  'FACEBOOK_TOKEN_MISSING',
  'FACEBOOK_PAGE_TOKEN_MISSING',
  'FACEBOOK_PERMISSION_MISSING',
  'FACEBOOK_PUBLISH_PERMISSION_MISSING',
  'PAGE_DISCONNECTED',
]

const PLANNING_LIST_PAGE_SIZE = 12
const PLANNING_LIST_PAGE_SIZE_OPTIONS = [12, 24, 48, 96]

export default function PlanningPage() {
  const { t } = useTranslation('planning')
  const errorMessage = useApiErrorMessage('planning')
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { brandId } = useActiveBrand()
  const { granted } = usePermissions()
  const reconnectFacebook = useReconnectFacebookPages(brandId)
  /** Toast action doing what Reconnect does in the Facebook Page manager. */
  const reconnectAction = (content: PlanningContent | null, socialAccountIds: string[]) => {
    const pageIds = (content?.publications ?? [])
      .filter((item) => socialAccountIds.includes(item.socialAccountId))
      .map((item) => item.target.providerAccountId)
      .filter((pageId): pageId is string => Boolean(pageId))
    // Reconnecting is a connection change; others only see the reason in the toast.
    if (!pageIds.length || !hasPermission(granted, PERMISSIONS.CHANNELS_MANAGE.key))
      return undefined
    return {
      label: t('detail.reconnectPages'),
      onClick: () =>
        reconnectFacebook
          .reconnect(pageIds)
          .then((outcome) => {
            if (outcome === 'reconnected') toast.success({ title: t('detail.reconnectSuccess') })
          })
          .catch((error: unknown) =>
            toast.error({ title: errorMessage(error, t('detail.reconnectError')) }),
          ),
    }
  }
  const { platform: routePlatformParam } = useParams<{ platform: string }>()

  const routePlatform = isPlanningPlatform(routePlatformParam) ? routePlatformParam : 'all'
  const [preferredView] = useState(readPreferredPlanningView)
  const planningFilterDefaults = useMemo(
    () => ({ ...PLANNING_FILTER_DEFAULTS, view: preferredView, date: getPlanningTodayDateKey() }),
    [preferredView],
  )
  const [urlFilters, setUrlFilters] = useUrlFilters(planningFilterDefaults)
  const [selectedContent, setSelectedContent] = useState<PlanningContent | null>(null)
  const reconciliationStarted = useRef(new Set<string>())
  const [detailAction, setDetailAction] = useState<'edit' | 'delete'>()
  const openDetails = useCallback((content: PlanningContent, action?: 'edit' | 'delete') => {
    reconciliationStarted.current.delete(content.id)
    setDetailAction(action)
    setSelectedContent(content)
  }, [])
  const [retryResults, setRetryResults] = useState<PlanningRetryResult[]>([])

  const view = isPlanningView(urlFilters.view) ? urlFilters.view : preferredView
  const calendarView = isPlanningCalendarView(urlFilters.calendarView)
    ? urlFilters.calendarView
    : 'month'
  const selectedDate = isDateKey(urlFilters.date) ? urlFilters.date : planningFilterDefaults.date
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
  // The list pages through posts; the calendar loads the weeks around the visible ones. A new
  // filter starts the list again from its first page.
  const filterKey = JSON.stringify(query)
  const [listPageState, setListPageState] = useState({
    filterKey,
    page: 1,
    pageSize: PLANNING_LIST_PAGE_SIZE,
  })
  const listPage = listPageState.filterKey === filterKey ? listPageState.page : 1
  const listPageSize = listPageState.pageSize
  const calendarWindows = useMemo(
    () => (view === 'calendar' ? planningCalendarWindows(selectedDate, calendarView) : []),
    [calendarView, selectedDate, view],
  )
  const accountsQuery = usePlanningAccounts(brandId)
  const listQuery = usePlanningContentPage(
    view === 'list' ? brandId : null,
    query,
    listPage,
    listPageSize,
  )
  const calendarQuery = usePlanningCalendarContents(brandId, query, calendarWindows)
  const contentsQuery =
    view === 'list'
      ? {
          isPending: listQuery.isPending,
          isError: listQuery.isError,
          refetch: () => void listQuery.refetch(),
        }
      : calendarQuery
  const selectedContentQuery = usePlanningContent(brandId, selectedContent?.id ?? null)
  useEffect(() => {
    if (selectedContentQuery.data) setSelectedContent(selectedContentQuery.data)
  }, [selectedContentQuery.data])
  const accountCounts = useSocialAccountCounts(brandId)
  const cancelContent = useCancelPlanningContent(brandId)
  const retryPublication = useRetryPlanningPublication(brandId)
  const retryFailed = useRetryFailedPlanningPublications(brandId)
  const deletePublished = useDeletePublishedPlanningPublication(brandId)
  const discardUnknown = useDiscardUnknownPlanningPublication(brandId)
  const deleteAll = useDeleteAllPlanningPublications(brandId)
  const reconcileUnknown = useReconcileUnknownPlanningPublications(brandId)
  const retryEdit = useEditPublishedPlanningCaption(brandId)
  const dismissEdit = useDismissUnknownPlanningEdit(brandId)
  useEffect(() => {
    if (!brandId || !selectedContent?.publications?.some((item) => item.status === 'unknown'))
      return
    const contentId = selectedContent.id
    if (reconciliationStarted.current.has(contentId)) return
    reconciliationStarted.current.add(contentId)
    void reconcileUnknown
      .mutateAsync({ brandId, contentId })
      .then((response) =>
        setSelectedContent((current) => (current?.id === contentId ? response.data : current)),
      )
      .catch(() => {
        // Manual recovery remains available if Facebook cannot be read.
      })
  }, [brandId, selectedContent?.id, selectedContent?.publications, reconcileUnknown.mutateAsync])
  const accounts = accountsQuery.data ?? []
  const createPlatform =
    platform === 'all'
      ? accounts.find((account) => canPublishOnPlatform(account.platform))?.platform
      : canPublishOnPlatform(platform)
        ? platform
        : undefined
  const canCreatePost = hasPermission(granted, PLANNING_ACCESS.publish[0])
  const listPagination = listQuery.data?.metadata?.pagination
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
        icon={<IconCalendar className="text-[35px] text-text-tertiary" aria-hidden />}
        title={t('states.noAccountsTitle')}
        description={t('states.noAccountsDescription')}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {/* Phone: the views and Filters share a row, the two ways to create share the next, half
          each. From 768px everything sits on one row. */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 md:flex-nowrap md:gap-3">
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
        <div className="ms-auto">
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
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto md:gap-3 [&>*]:min-w-0 [&>*]:flex-1 md:[&>*]:flex-none">
          <AiCreateButton
            brandId={brandId}
            platform={platform === 'tiktok' ? 'tiktok' : 'facebook'}
            defaultPageId={query.accountId !== 'all' ? query.accountId : undefined}
            onCreated={() =>
              void queryClient.invalidateQueries({ queryKey: PLANNING_QUERY_KEYS.root(brandId) })
            }
            onOpenContent={(contentId, contentPlatform) =>
              navigate(getPlanningEditPath(contentPlatform, contentId))
            }
            onUseSuggestion={(aiSuggestion) =>
              navigate(getPlanningCreatePath(aiSuggestion.platform), { state: { aiSuggestion } })
            }
          />
          <CreatePostButton accounts={accounts} platform={platform} />
        </div>
      </div>

      {view === 'calendar' ? (
        <PlanningCalendar
          brandId={brandId}
          contents={calendarQuery.items}
          createPlatform={canCreatePost ? createPlatform : undefined}
          calendarView={calendarView}
          selectedDate={selectedDate}
          onCalendarViewChange={(nextView) => setUrlFilters({ calendarView: nextView })}
          onDateChange={(date) => setUrlFilters({ date })}
          onSelectContent={openDetails}
          onCreatePost={(date, postType) => {
            if (!createPlatform) return
            navigate(getPlanningCreatePath(createPlatform, { date, postType }))
          }}
        />
      ) : (
        // The table shrinks to the space left and scrolls its rows under a sticky header, keeping
        // the pagination in view below it.
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <PlanningList
            brandId={brandId}
            contents={listQuery.data?.data ?? []}
            accounts={accounts}
            platform={platform}
            accountId={query.accountId}
            statusGroup={statusGroup}
            approvalStatus={approvalStatus}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onFiltersChange={setUrlFilters}
            onSelectContent={openDetails}
            onEditContent={editContent}
          />
          {listPagination && listPagination.total > 0 ? (
            <div className="flex shrink-0 justify-end pb-1">
              <Pagination
                compact
                current={listPage}
                pageSize={listPageSize}
                pageSizeOptions={PLANNING_LIST_PAGE_SIZE_OPTIONS}
                total={listPagination.total}
                onChange={(page, pageSize) =>
                  setListPageState({
                    filterKey,
                    // A new page size starts again from the first page.
                    page: pageSize === listPageSize ? page : 1,
                    pageSize,
                  })
                }
              />
            </div>
          ) : null}
        </div>
      )}

      <PlanningPostModal
        key={`${selectedContent?.id ?? ''}:${detailAction ?? ''}`}
        initialAction={detailAction}
        content={selectedContent}
        retryResults={retryResults}
        reconciling={reconcileUnknown.isPending}
        onClose={() => {
          if (selectedContent) reconciliationStarted.current.delete(selectedContent.id)
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
          } catch (error) {
            toast.error({ title: errorMessage(error, t('detail.cancelError')) })
            throw error
          }
        }}
        onRetryPublication={async (publicationId) => {
          if (!brandId) return
          try {
            const response = await retryPublication.mutateAsync({ brandId, publicationId })
            setSelectedContent(response.data)
            toast.success({ title: t('detail.retrySuccess') })
          } catch (error) {
            const publication = selectedContent?.publications?.find(
              (item) => item.id === publicationId,
            )
            toast.error({
              title: errorMessage(error, t('detail.retryError')),
              action:
                publication && isApiErrorCode(error, FACEBOOK_RECONNECT_CODES)
                  ? reconnectAction(selectedContent, [publication.socialAccountId])
                  : undefined,
            })
          }
        }}
        onRetryFailed={async (contentId) => {
          if (!brandId) return
          try {
            const response = await retryFailed.mutateAsync({ brandId, contentId })
            setSelectedContent(response.data.content)
            setRetryResults(response.data.results)
            const queued = response.data.results.filter((item) => item.outcome === 'queued').length
            const action = reconnectAction(
              response.data.content,
              response.data.results
                .filter((item) => FACEBOOK_RECONNECT_CODES.includes(item.reason ?? ''))
                .map((item) => item.socialAccountId),
            )
            if (queued) toast.success({ title: t('detail.retryAllResult', { queued }), action })
            else toast.error({ title: t('detail.retryNone'), action })
          } catch (error) {
            toast.error({ title: errorMessage(error, t('detail.retryError')) })
          }
        }}
        onDeleteAll={async (contentId) => {
          if (!brandId) return
          try {
            const response = await deleteAll.mutateAsync({ brandId, contentId })
            const failed = response.data.results.filter((item) => item.outcome === 'failed').length
            const deleted = response.data.results.filter(
              (item) => item.outcome === 'deleted',
            ).length
            setSelectedContent(
              ['cancelled', 'deleted'].includes(response.data.content.status)
                ? null
                : response.data.content,
            )
            if (failed) toast.error({ title: t('detail.deleteAllPartial', { deleted, failed }) })
            else toast.success({ title: t('detail.deleteAllSuccess', { deleted }) })
          } catch (error) {
            toast.error({ title: errorMessage(error, t('detail.deleteAllError')) })
            throw error
          }
        }}
        onOpenPublishedEditor={(publication) => {
          if (!selectedContent) return
          setSelectedContent(null)
          navigate(
            `${getPlanningEditPath(selectedContent.platform, selectedContent.id)}?accountId=${encodeURIComponent(publication.socialAccountId)}`,
          )
        }}
        onDeletePublished={async (publicationId) => {
          if (!brandId) return
          try {
            const response = await deletePublished.mutateAsync({ brandId, publicationId })
            setSelectedContent(
              ['cancelled', 'deleted'].includes(response.data.status) ? null : response.data,
            )
            toast.success({ title: t('detail.deletePublishedSuccess') })
          } catch (error) {
            toast.error({ title: errorMessage(error, t('detail.deletePublishedError')) })
            throw error
          }
        }}
        onRetryEdit={async (publication) => {
          if (!brandId || !publication.pendingCaption) return
          try {
            const response = await retryEdit.mutateAsync({
              brandId,
              publicationId: publication.id,
              caption: publication.pendingCaption,
            })
            setSelectedContent(response.data)
            toast.success({ title: t('detail.retryEditSuccess') })
          } catch (error) {
            toast.error({ title: errorMessage(error, t('detail.editActionError')) })
          }
        }}
        onDismissEdit={async (publicationId) => {
          if (!brandId) return
          try {
            const response = await dismissEdit.mutateAsync({ brandId, publicationId })
            setSelectedContent(response.data)
            toast.success({ title: t('detail.dismissEditSuccess') })
          } catch (error) {
            toast.error({ title: errorMessage(error, t('detail.editActionError')) })
          }
        }}
        onDiscardUnknown={async (publicationId) => {
          if (!brandId) return
          const hasFacebookPostId = Boolean(
            selectedContent?.publications?.find((item) => item.id === publicationId)
              ?.externalPostId,
          )
          try {
            const response = await discardUnknown.mutateAsync({ brandId, publicationId })
            setSelectedContent(
              ['cancelled', 'deleted'].includes(response.data.status) ? null : response.data,
            )
            toast.success({
              title: t(
                hasFacebookPostId ? 'detail.discardUnknownSuccess' : 'detail.cancelUnknownSuccess',
              ),
            })
          } catch (error) {
            toast.error({ title: errorMessage(error, t('detail.discardUnknownError')) })
            throw error
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
      <EmptyState
        icon={
          icon ? <span className="flex h-full items-end justify-center">{icon}</span> : undefined
        }
        title={title}
        description={description}
      />
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

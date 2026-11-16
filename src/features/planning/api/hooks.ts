import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import {
  createPlanningContent,
  getPlanningAccounts,
  getPlanningContent,
  getPlanningCalendarContents,
  getPlanningContentPage,
  reschedulePlanningContent,
  updatePlanningApproval,
  updatePlanningContent,
  cancelPlanningContent,
  retryPlanningPublication,
  retryFailedPlanningPublications,
  reconcileUnknownPlanningPublications,
  editPublishedPlanningCaption,
  editPublishedPlanningCaptions,
  deletePublishedPlanningPublication,
  discardUnknownPlanningPublication,
  deleteAllPlanningPublications,
  dismissUnknownPlanningEdit,
  getPlanningSummary,
} from './service'
import type {
  CreatePlanningContentInput,
  PlanningContent,
  PlanningQuery,
  ReschedulePlanningContentInput,
  UpdatePlanningApprovalInput,
  UpdatePlanningContentInput,
} from './types'

export const PLANNING_QUERY_KEYS = {
  root: (brandId: string | null) => ['planning', brandId] as const,
  accounts: (brandId: string | null) => [...PLANNING_QUERY_KEYS.root(brandId), 'accounts'] as const,
  contentPage: (brandId: string | null, query: PlanningQuery, page: number, limit: number) =>
    [...PLANNING_QUERY_KEYS.root(brandId), 'contents', 'page', query, page, limit] as const,
  calendar: (brandId: string | null, query: PlanningQuery, from: string) =>
    [...PLANNING_QUERY_KEYS.root(brandId), 'contents', 'calendar', query, from] as const,
  summary: (brandId: string | null, range: { since?: string; until?: string }) =>
    [...PLANNING_QUERY_KEYS.root(brandId), 'summary', range] as const,
  detail: (brandId: string | null, contentId: string | null) =>
    [...PLANNING_QUERY_KEYS.root(brandId), 'detail', contentId] as const,
}

export function usePlanningAccounts(brandId: string | null) {
  return useQuery({
    queryKey: PLANNING_QUERY_KEYS.accounts(brandId),
    queryFn: () => getPlanningAccounts(brandId!),
    enabled: brandId !== null,
    select: (response) => response.data.items,
  })
}

const ACTIVE_STATUSES = [
  'queued',
  'publishing',
  'processing',
  'verifying',
  'retry_wait',
  'edit_queued',
  'editing',
  'deleting',
]

/** Poll while something is publishing (fast) or scheduled (slow), so statuses stay fresh. */
function pollInterval(items: PlanningContent[] | undefined): number | false {
  const statuses = items?.map((item) => item.status) ?? []
  if (statuses.some((status) => ACTIVE_STATUSES.includes(status))) return 5000
  return statuses.includes('scheduled') ? 30000 : false
}

/** One page of the post list; the previous page stays on screen while the next loads. */
export function usePlanningContentPage(
  brandId: string | null,
  query: PlanningQuery,
  page: number,
  limit: number,
) {
  return useQuery({
    queryKey: PLANNING_QUERY_KEYS.contentPage(brandId, query, page, limit),
    queryFn: () => getPlanningContentPage(brandId!, query, page, limit),
    enabled: brandId !== null,
    refetchInterval: (current) => pollInterval(current.state.data?.data),
    placeholderData: (previous) => previous,
  })
}

export type PlanningCalendarContents = {
  items: PlanningContent[]
  /** Nothing loaded yet for any window. */
  isPending: boolean
  isFetching: boolean
  isError: boolean
  refetch: () => void
}

function combineCalendarWindows(
  results: UseQueryResult<PlanningContent[]>[],
): PlanningCalendarContents {
  const seen = new Set<string>()
  const items: PlanningContent[] = []
  for (const result of results)
    for (const item of result.data ?? [])
      if (!seen.has(item.id)) {
        seen.add(item.id)
        items.push(item)
      }
  return {
    items,
    isPending: results.every((result) => result.isPending),
    isFetching: results.some((result) => result.isFetching),
    isError: results.some((result) => result.isError),
    refetch: () => results.forEach((result) => void result.refetch()),
  }
}

/**
 * Calendar posts loaded window by window (see `planningCalendarWindows`). Each window is
 * cached on its own, so navigating reuses loaded weeks and only fetches new ones.
 */
export function usePlanningCalendarContents(
  brandId: string | null,
  query: PlanningQuery,
  windows: Array<{ from: string; to: string }>,
): PlanningCalendarContents {
  return useQueries({
    queries: windows.map((window) => ({
      queryKey: PLANNING_QUERY_KEYS.calendar(brandId, query, window.from),
      queryFn: () => getPlanningCalendarContents(brandId!, query, window),
      enabled: brandId !== null,
      select: (response: Awaited<ReturnType<typeof getPlanningCalendarContents>>) =>
        response.data.items,
      staleTime: 30_000,
      refetchInterval: (current: { state: { data?: { data: { items: PlanningContent[] } } } }) =>
        pollInterval(current.state.data?.data.items),
    })),
    combine: combineCalendarWindows,
  })
}

export function usePlanningSummary(
  brandId: string | null,
  range: { since?: string; until?: string },
) {
  return useQuery({
    queryKey: PLANNING_QUERY_KEYS.summary(brandId, range),
    queryFn: () => getPlanningSummary(brandId!, range),
    enabled: brandId !== null,
    select: (response) => response.data,
    refetchInterval: 60_000,
  })
}

export function usePlanningContent(brandId: string | null, contentId: string | null) {
  return useQuery({
    queryKey: PLANNING_QUERY_KEYS.detail(brandId, contentId),
    queryFn: () => getPlanningContent(brandId!, contentId!),
    enabled: brandId !== null && contentId !== null,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    // Back on this tab, pick up changes made elsewhere (e.g. the post was deleted in another tab).
    refetchOnWindowFocus: true,
    select: (response) => response.data,
    refetchInterval: (current) => {
      const content = current.state.data?.data
      return content &&
        [
          'queued',
          'publishing',
          'processing',
          'verifying',
          'retry_wait',
          'edit_queued',
          'editing',
          'deleting',
        ].includes(content.status)
        ? 5000
        : false
    },
  })
}

function usePlanningMutation<TInput, TOutput = unknown>(
  brandId: string | null,
  mutationFn: (input: TInput) => Promise<TOutput>,
) {
  const client = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: PLANNING_QUERY_KEYS.root(brandId) })
    },
  })
}

export function useCreatePlanningContent(brandId: string | null) {
  return usePlanningMutation<CreatePlanningContentInput>(brandId, createPlanningContent)
}

export function useReschedulePlanningContent(brandId: string | null) {
  return usePlanningMutation<ReschedulePlanningContentInput>(brandId, reschedulePlanningContent)
}

export function useUpdatePlanningApproval(brandId: string | null) {
  return usePlanningMutation<UpdatePlanningApprovalInput>(brandId, updatePlanningApproval)
}

export function useUpdatePlanningContent(brandId: string | null) {
  return usePlanningMutation<UpdatePlanningContentInput>(brandId, updatePlanningContent)
}

export function useCancelPlanningContent(brandId: string | null) {
  return usePlanningMutation<{ brandId: string; contentId: string }>(brandId, cancelPlanningContent)
}

export function useRetryPlanningPublication(brandId: string | null) {
  return usePlanningMutation(brandId, retryPlanningPublication)
}

export function useRetryFailedPlanningPublications(brandId: string | null) {
  return usePlanningMutation(brandId, retryFailedPlanningPublications)
}

export function useReconcileUnknownPlanningPublications(brandId: string | null) {
  return usePlanningMutation(brandId, reconcileUnknownPlanningPublications)
}

export function useEditPublishedPlanningCaption(brandId: string | null) {
  return usePlanningMutation(brandId, editPublishedPlanningCaption)
}

export function useEditPublishedPlanningCaptions(brandId: string | null) {
  return usePlanningMutation(brandId, editPublishedPlanningCaptions)
}

export function useDeletePublishedPlanningPublication(brandId: string | null) {
  return usePlanningMutation(brandId, deletePublishedPlanningPublication)
}

export function useDiscardUnknownPlanningPublication(brandId: string | null) {
  return usePlanningMutation(brandId, discardUnknownPlanningPublication)
}

export function useDismissUnknownPlanningEdit(brandId: string | null) {
  return usePlanningMutation(brandId, dismissUnknownPlanningEdit)
}

export function useDeleteAllPlanningPublications(brandId: string | null) {
  return usePlanningMutation(brandId, deleteAllPlanningPublications)
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPlanningContent,
  getPlanningAccounts,
  getPlanningContent,
  getPlanningContents,
  reschedulePlanningContent,
  updatePlanningApproval,
  updatePlanningContent,
  cancelPlanningContent,
  retryPlanningPublication,
  retryFailedPlanningPublications,
  editPublishedPlanningCaption,
  deletePublishedPlanningPublication,
} from './service'
import type {
  CreatePlanningContentInput,
  PlanningQuery,
  ReschedulePlanningContentInput,
  UpdatePlanningApprovalInput,
  UpdatePlanningContentInput,
} from './types'

export const PLANNING_QUERY_KEYS = {
  root: (brandId: string | null) => ['planning', brandId] as const,
  accounts: (brandId: string | null) => [...PLANNING_QUERY_KEYS.root(brandId), 'accounts'] as const,
  contents: (brandId: string | null, query: PlanningQuery) =>
    [...PLANNING_QUERY_KEYS.root(brandId), 'contents', query] as const,
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

export function usePlanningContents(brandId: string | null, query: PlanningQuery) {
  return useQuery({
    queryKey: PLANNING_QUERY_KEYS.contents(brandId, query),
    queryFn: () => getPlanningContents(brandId!, query),
    enabled: brandId !== null,
    select: (response) => response.data,
    refetchInterval: (current) => {
      const statuses = current.state.data?.data.items.map((item) => item.status) ?? []
      if (
        statuses.some((status) =>
          [
            'queued',
            'publishing',
            'processing',
            'verifying',
            'retry_wait',
            'editing',
            'deleting',
          ].includes(status),
        )
      )
        return 5000
      return statuses.includes('scheduled') ? 30000 : false
    },
    placeholderData: (previous) => previous,
  })
}

export function usePlanningContent(brandId: string | null, contentId: string | null) {
  return useQuery({
    queryKey: PLANNING_QUERY_KEYS.detail(brandId, contentId),
    queryFn: () => getPlanningContent(brandId!, contentId!),
    enabled: brandId !== null && contentId !== null,
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

export function useEditPublishedPlanningCaption(brandId: string | null) {
  return usePlanningMutation(brandId, editPublishedPlanningCaption)
}

export function useDeletePublishedPlanningPublication(brandId: string | null) {
  return usePlanningMutation(brandId, deletePublishedPlanningPublication)
}

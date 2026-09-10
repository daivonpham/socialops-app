import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPlanningContent,
  getPlanningContent,
  getPlanningContents,
  reschedulePlanningContent,
  updatePlanningApproval,
  updatePlanningContent,
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
  contents: (brandId: string | null, query: PlanningQuery) =>
    [...PLANNING_QUERY_KEYS.root(brandId), 'contents', query] as const,
  detail: (brandId: string | null, contentId: string | null) =>
    [...PLANNING_QUERY_KEYS.root(brandId), 'detail', contentId] as const,
}

export function usePlanningContents(brandId: string | null, query: PlanningQuery) {
  return useQuery({
    queryKey: PLANNING_QUERY_KEYS.contents(brandId, query),
    queryFn: () => getPlanningContents(brandId!, query),
    enabled: brandId !== null,
    select: (response) => response.data,
    placeholderData: (previous) => previous,
  })
}

export function usePlanningContent(brandId: string | null, contentId: string | null) {
  return useQuery({
    queryKey: PLANNING_QUERY_KEYS.detail(brandId, contentId),
    queryFn: () => getPlanningContent(brandId!, contentId!),
    enabled: brandId !== null && contentId !== null,
    select: (response) => response.data,
  })
}

function usePlanningMutation<TInput>(
  brandId: string | null,
  mutationFn: (input: TInput) => Promise<unknown>,
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

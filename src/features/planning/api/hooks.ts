import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPlanningContent, getPlanningContents, reschedulePlanningContent } from './service'
import type {
  CreatePlanningContentInput,
  PlanningQuery,
  ReschedulePlanningContentInput,
} from './types'

export const PLANNING_QUERY_KEYS = {
  root: (brandId: string | null) => ['planning', brandId] as const,
  contents: (brandId: string | null, query: PlanningQuery) =>
    [...PLANNING_QUERY_KEYS.root(brandId), 'contents', query] as const,
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

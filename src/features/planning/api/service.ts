import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  CreatePlanningContentInput,
  PlanningContent,
  PlanningContentsResponse,
  PlanningQuery,
  ReschedulePlanningContentInput,
} from './types'

export async function getPlanningContents(brandId: string, query: PlanningQuery) {
  return (
    await apiClient.get<CommonApiResponse<PlanningContentsResponse>>(
      `/brands/${brandId}/planning`,
      { params: query },
    )
  ).data
}

export async function createPlanningContent(input: CreatePlanningContentInput) {
  const { brandId, ...body } = input
  return (
    await apiClient.post<CommonApiResponse<PlanningContent>>(`/brands/${brandId}/planning`, body)
  ).data
}

export async function reschedulePlanningContent(input: ReschedulePlanningContentInput) {
  const { brandId, contentId, scheduledAt } = input
  return (
    await apiClient.patch<CommonApiResponse<PlanningContent>>(
      `/brands/${brandId}/planning/${contentId}/reschedule`,
      { scheduledAt },
    )
  ).data
}

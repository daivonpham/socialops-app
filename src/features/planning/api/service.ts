import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  CreatePlanningContentInput,
  PlanningAccountsResponse,
  PlanningContent,
  UpdatePlanningApprovalInput,
  PlanningContentsResponse,
  PlanningQuery,
  PlanningRetryBatchResponse,
  ReschedulePlanningContentInput,
  UpdatePlanningContentInput,
} from './types'

export async function getPlanningAccounts(brandId: string) {
  return (
    await apiClient.get<CommonApiResponse<PlanningAccountsResponse>>(
      `/brands/${brandId}/planning/accounts`,
    )
  ).data
}

export async function getPlanningContents(brandId: string, query: PlanningQuery) {
  return (
    await apiClient.get<CommonApiResponse<PlanningContentsResponse>>(
      `/brands/${brandId}/planning`,
      { params: query },
    )
  ).data
}

export async function getPlanningContent(brandId: string, contentId: string) {
  return (
    await apiClient.get<CommonApiResponse<PlanningContent>>(
      `/brands/${brandId}/planning/${contentId}`,
    )
  ).data
}

export async function createPlanningContent(input: CreatePlanningContentInput) {
  const { brandId, idempotencyKey, ...body } = input
  return (
    await apiClient.post<CommonApiResponse<PlanningContent>>(`/brands/${brandId}/planning`, body, {
      headers: { 'Idempotency-Key': idempotencyKey ?? crypto.randomUUID() },
    })
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

export async function updatePlanningApproval(input: UpdatePlanningApprovalInput) {
  const { brandId, contentId, approvalStatus } = input
  return (
    await apiClient.patch<CommonApiResponse<PlanningContent>>(
      `/brands/${brandId}/planning/${contentId}/approval`,
      { approvalStatus },
    )
  ).data
}

export async function updatePlanningContent(input: UpdatePlanningContentInput) {
  const { brandId, contentId, ...body } = input
  return (
    await apiClient.patch<CommonApiResponse<PlanningContent>>(
      `/brands/${brandId}/planning/${contentId}`,
      body,
    )
  ).data
}

export async function uploadPlanningMedia(brandId: string, file: File) {
  const started = (
    await apiClient.post<CommonApiResponse<{ id: string; uploadUrl: string }>>(
      `/brands/${brandId}/planning/media`,
      { name: file.name, mimeType: file.type, sizeBytes: file.size },
    )
  ).data.data
  const upload = await fetch(started.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!upload.ok) throw new Error('Media upload failed')
  return (
    await apiClient.post<
      CommonApiResponse<{ id: string; type: 'image' | 'video'; name: string; url: string }>
    >(`/brands/${brandId}/planning/media/${started.id}/finalize`, {})
  ).data.data
}

export async function cancelPlanningContent(input: { brandId: string; contentId: string }) {
  return (
    await apiClient.delete<CommonApiResponse<PlanningContent>>(
      `/brands/${input.brandId}/planning/${input.contentId}`,
    )
  ).data
}

export async function retryPlanningPublication(input: { brandId: string; publicationId: string }) {
  return (
    await apiClient.post<CommonApiResponse<PlanningContent>>(
      `/brands/${input.brandId}/planning/publications/${input.publicationId}/retry`,
      {},
    )
  ).data
}

export async function retryFailedPlanningPublications(input: {
  brandId: string
  contentId: string
}) {
  return (
    await apiClient.post<CommonApiResponse<PlanningRetryBatchResponse>>(
      `/brands/${input.brandId}/planning/${input.contentId}/retry-failed`,
      {},
    )
  ).data
}

export async function editPublishedPlanningCaption(input: {
  brandId: string
  publicationId: string
  caption: string
}) {
  return (
    await apiClient.patch<CommonApiResponse<PlanningContent>>(
      `/brands/${input.brandId}/planning/publications/${input.publicationId}/caption`,
      { caption: input.caption },
    )
  ).data
}

export async function deletePublishedPlanningPublication(input: {
  brandId: string
  publicationId: string
}) {
  return (
    await apiClient.delete<CommonApiResponse<PlanningContent>>(
      `/brands/${input.brandId}/planning/publications/${input.publicationId}/published`,
    )
  ).data
}

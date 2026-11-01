import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  CreatePlanningContentInput,
  PlanningAccountsResponse,
  PlanningCaptionMode,
  PlanningContent,
  UpdatePlanningApprovalInput,
  PlanningContentsResponse,
  PlanningQuery,
  PlanningRetryBatchResponse,
  PlanningSummary,
  PlanningDeleteBatchResponse,
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

/** One page of the post list (`metadata.pagination` tells the total). */
export async function getPlanningContentPage(
  brandId: string,
  query: PlanningQuery,
  page: number,
  limit: number,
) {
  return (
    await apiClient.get<CommonApiResponse<PlanningContent[]>>(`/brands/${brandId}/planning`, {
      params: { ...query, page, limit },
    })
  ).data
}

/** Every post whose calendar time falls in the window (at most 100 days). */
export async function getPlanningCalendarContents(
  brandId: string,
  query: PlanningQuery,
  window: { from: string; to: string },
) {
  return (
    await apiClient.get<CommonApiResponse<PlanningContentsResponse>>(
      `/brands/${brandId}/planning`,
      { params: { ...query, ...window } },
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
  const { brandId, contentId, ...body } = input
  return (
    await apiClient.patch<CommonApiResponse<PlanningContent>>(
      `/brands/${brandId}/planning/${contentId}/approval`,
      body,
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

export async function uploadPlanningMedia(
  brandId: string,
  file: File,
  onProgress?: (loaded: number) => void,
) {
  const started = (
    await apiClient.post<CommonApiResponse<{ id: string; uploadUrl: string }>>(
      `/brands/${brandId}/planning/media`,
      { name: file.name, mimeType: file.type, sizeBytes: file.size },
    )
  ).data.data
  await new Promise<void>((resolve, reject) => {
    const upload = new XMLHttpRequest()
    upload.open('PUT', started.uploadUrl)
    upload.setRequestHeader('Content-Type', file.type)
    upload.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded)
    }
    upload.onload = () => {
      if (upload.status >= 200 && upload.status < 300) {
        onProgress?.(file.size)
        resolve()
      } else reject(new Error('Media upload failed'))
    }
    upload.onerror = () => reject(new Error('Media upload failed'))
    upload.onabort = () => reject(new Error('Media upload aborted'))
    upload.send(file)
  })
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

export async function reconcileUnknownPlanningPublications(input: {
  brandId: string
  contentId: string
}) {
  return (
    await apiClient.post<CommonApiResponse<PlanningContent>>(
      `/brands/${input.brandId}/planning/${input.contentId}/reconcile-unknown`,
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
    await apiClient.post<CommonApiResponse<PlanningContent>>(
      `/brands/${input.brandId}/planning/publications/${input.publicationId}/caption-edit`,
      { caption: input.caption },
    )
  ).data
}

/** Edits every published Page at once; Facebook applies each Page edit in the background. */
export async function editPublishedPlanningCaptions(input: {
  brandId: string
  contentId: string
  captionMode: PlanningCaptionMode
  caption: string
  captions: Array<{ publicationId: string; caption: string }>
}) {
  return (
    await apiClient.post<CommonApiResponse<PlanningContent>>(
      `/brands/${input.brandId}/planning/${input.contentId}/caption-edit`,
      { captionMode: input.captionMode, caption: input.caption, captions: input.captions },
    )
  ).data
}

export async function dismissUnknownPlanningEdit(input: {
  brandId: string
  publicationId: string
}) {
  return (
    await apiClient.delete<CommonApiResponse<PlanningContent>>(
      `/brands/${input.brandId}/planning/publications/${input.publicationId}/pending-edit`,
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

export async function discardUnknownPlanningPublication(input: {
  brandId: string
  publicationId: string
}) {
  return (
    await apiClient.delete<CommonApiResponse<PlanningContent>>(
      `/brands/${input.brandId}/planning/publications/${input.publicationId}/unknown`,
    )
  ).data
}

export async function deleteAllPlanningPublications(input: { brandId: string; contentId: string }) {
  return (
    await apiClient.delete<CommonApiResponse<PlanningDeleteBatchResponse>>(
      `/brands/${input.brandId}/planning/${input.contentId}/all`,
    )
  ).data
}

export async function getPlanningSummary(
  brandId: string,
  range: { since?: string; until?: string },
) {
  return (
    await apiClient.get<CommonApiResponse<PlanningSummary>>(`/brands/${brandId}/planning/summary`, {
      params: range,
    })
  ).data
}

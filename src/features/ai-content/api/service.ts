import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  AiAttachment,
  AiAvailability,
  AiConversation,
  AiConversationSummary,
  AiGenerationStarted,
  AiPostIntent,
  AiTemplateOption,
  BrandAiProfile,
  StartAiGenerationInput,
  UpdateBrandAiProfileInput,
} from './types'

const base = (brandId: string) => `/brands/${brandId}/ai`

export async function getAiAvailability(brandId: string) {
  return (await apiClient.get<CommonApiResponse<AiAvailability>>(`${base(brandId)}/availability`))
    .data.data
}

export async function getAiTemplates(brandId: string) {
  return (await apiClient.get<CommonApiResponse<AiTemplateOption[]>>(`${base(brandId)}/templates`))
    .data.data
}

export async function getBrandAiProfile(brandId: string) {
  return (await apiClient.get<CommonApiResponse<BrandAiProfile>>(`${base(brandId)}/profile`)).data
    .data
}

export async function updateBrandAiProfile({
  brandId,
  ...input
}: UpdateBrandAiProfileInput & { brandId: string }) {
  return (await apiClient.put<CommonApiResponse<BrandAiProfile>>(`${base(brandId)}/profile`, input))
    .data.data
}

/** The key stays the same for one press, so a repeated request starts one generation. */
export async function startAiGeneration({
  brandId,
  idempotencyKey,
  ...input
}: StartAiGenerationInput & { brandId: string; idempotencyKey: string }) {
  return (
    await apiClient.post<CommonApiResponse<AiGenerationStarted>>(
      `${base(brandId)}/generations`,
      input,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    )
  ).data.data
}

/** "Try another idea" (no instruction) or "Edit again" (with one), as a new turn of the chat. */
export async function followUpAiGeneration({
  brandId,
  generationId,
  idempotencyKey,
  instruction,
}: {
  brandId: string
  generationId: string
  idempotencyKey: string
  instruction?: string
}) {
  const action = instruction === undefined ? 'retry' : 'edit'
  return (
    await apiClient.post<CommonApiResponse<AiGenerationStarted>>(
      `${base(brandId)}/generations/${generationId}/${action}`,
      instruction === undefined ? {} : { instruction },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    )
  ).data.data
}

/** "Publish now" or "Send for approval" from a suggestion. */
export async function postAiSuggestion({
  brandId,
  generationId,
  intent,
}: {
  brandId: string
  generationId: string
  intent: AiPostIntent
}) {
  return (
    await apiClient.post<CommonApiResponse<{ contentId: string }>>(
      `${base(brandId)}/generations/${generationId}/post`,
      { intent },
    )
  ).data.data
}

export async function getAiConversations(brandId: string) {
  return (
    await apiClient.get<CommonApiResponse<AiConversationSummary[]>>(
      `${base(brandId)}/conversations`,
    )
  ).data.data
}

export async function getAiConversation(brandId: string, conversationId: string) {
  return (
    await apiClient.get<CommonApiResponse<AiConversation>>(
      `${base(brandId)}/conversations/${conversationId}`,
    )
  ).data.data
}

/**
 * Uploads one composer attachment: the API signs a PUT address, the browser sends the file there,
 * then the API checks what arrived. `mimeType` must be the one the API accepts for the file.
 */
export async function uploadAiAttachment(
  brandId: string,
  file: File,
  mimeType: string,
  { signal, onProgress }: { signal?: AbortSignal; onProgress?: (ratio: number) => void } = {},
) {
  const started = (
    await apiClient.post<CommonApiResponse<{ id: string; uploadUrl: string }>>(
      `${base(brandId)}/attachments`,
      { name: file.name, mimeType, sizeBytes: file.size },
      { signal },
    )
  ).data.data
  await new Promise<void>((resolve, reject) => {
    const upload = new XMLHttpRequest()
    const abort = () => upload.abort()
    signal?.addEventListener('abort', abort, { once: true })
    upload.open('PUT', started.uploadUrl)
    upload.setRequestHeader('Content-Type', mimeType)
    upload.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    upload.onload = () => {
      signal?.removeEventListener('abort', abort)
      if (upload.status >= 200 && upload.status < 300) resolve()
      else reject(new Error('Attachment upload failed'))
    }
    upload.onerror = () => reject(new Error('Attachment upload failed'))
    upload.onabort = () => reject(new DOMException('Attachment upload aborted', 'AbortError'))
    upload.send(file)
  }).catch((error: unknown) => {
    // The started row is cleaned up by the API either way; say so early when we can.
    void releaseAiAttachment(brandId, started.id).catch(() => undefined)
    throw error
  })
  return (
    await apiClient.post<CommonApiResponse<AiAttachment>>(
      `${base(brandId)}/attachments/${started.id}/finalize`,
      {},
      { signal },
    )
  ).data.data
}

/** Lets the API delete an attachment the customer removed. */
export async function releaseAiAttachment(brandId: string, attachmentId: string) {
  await apiClient.delete(`${base(brandId)}/attachments/${attachmentId}`)
}

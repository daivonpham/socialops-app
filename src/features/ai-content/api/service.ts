import { apiClient } from '@/shared/api/client'
import { readEventStream } from '@/shared/api/eventStream'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  AiAttachment,
  AiAvailability,
  AiConversation,
  AiConversationSummary,
  AiGenerationStarted,
  AiOnboarding,
  AiProfileSuggestion,
  ConfirmAiOnboardingInput,
  AiPostIntent,
  AiStreamMessage,
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

export async function getAiOnboarding(brandId: string) {
  return (await apiClient.get<CommonApiResponse<AiOnboarding>>(`${base(brandId)}/onboarding`)).data
    .data
}

export async function suggestAiProfile(brandId: string) {
  return (
    await apiClient.post<CommonApiResponse<AiProfileSuggestion>>(
      `${base(brandId)}/onboarding/suggest`,
    )
  ).data.data
}

export async function skipAiOnboarding(brandId: string) {
  await apiClient.post(`${base(brandId)}/onboarding/skip`)
}

/** Saves the profile and starts the three samples; the key keeps a repeat from doing it twice. */
export async function confirmAiOnboarding({
  brandId,
  idempotencyKey,
  ...input
}: ConfirmAiOnboardingInput & { brandId: string; idempotencyKey: string }) {
  return (
    await apiClient.post<CommonApiResponse<{ conversationId: string }>>(
      `${base(brandId)}/onboarding/confirm`,
      input,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    )
  ).data.data
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
  socialAccountIds,
}: {
  brandId: string
  generationId: string
  intent: AiPostIntent
  /** Only for a suggestion made without Pages. */
  socialAccountIds?: string[]
}) {
  return (
    await apiClient.post<CommonApiResponse<{ contentId: string }>>(
      `${base(brandId)}/generations/${generationId}/post`,
      { intent, ...(socialAccountIds ? { socialAccountIds } : {}) },
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

/** A new name for one chat; returns the chat as the list shows it. */
export async function renameAiConversation({
  brandId,
  conversationId,
  title,
}: {
  brandId: string
  conversationId: string
  title: string
}) {
  return (
    await apiClient.patch<CommonApiResponse<AiConversationSummary>>(
      `${base(brandId)}/conversations/${conversationId}`,
      { title },
    )
  ).data.data
}

/** Hides the chat from its owner; `AI_CONVERSATION_BUSY` while a turn is being made. */
export async function deleteAiConversation({
  brandId,
  conversationId,
}: {
  brandId: string
  conversationId: string
}) {
  await apiClient.delete(`${base(brandId)}/conversations/${conversationId}`)
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

/** The text of a running turn as it is written, until the turn ends or `signal` aborts. */
export function streamAiGeneration(
  brandId: string,
  generationId: string,
  onMessage: (message: AiStreamMessage) => void,
  signal: AbortSignal,
) {
  return readEventStream(
    `${base(brandId)}/generations/${generationId}/stream`,
    (message) => {
      if (
        typeof message === 'object' &&
        message !== null &&
        'kind' in message &&
        'seq' in message &&
        typeof message.seq === 'number'
      )
        onMessage(message as AiStreamMessage)
    },
    signal,
  )
}

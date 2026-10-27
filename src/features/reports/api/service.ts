import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type { ReportConfig, ReportDocument, ReportRefresh, ReportsList, SavedReport } from './types'

const root = (brandId: string) => `/brands/${brandId}/reports`

export async function getReports(brandId: string, page = 1, search = '') {
  const response = await apiClient.get<CommonApiResponse<ReportsList>>(root(brandId), {
    params: { page, search },
  })
  return response.data.data
}

export async function getReport(brandId: string, id: string) {
  const response = await apiClient.get<CommonApiResponse<SavedReport>>(`${root(brandId)}/${id}`)
  return response.data.data
}

export async function previewReport(
  brandId: string,
  config: ReportConfig,
  postsPage = 1,
  title = '',
) {
  const response = await apiClient.post<CommonApiResponse<ReportDocument>>(
    `${root(brandId)}/preview`,
    { config, postsPage, title },
  )
  return response.data.data
}

export async function requestReportRefresh(
  brandId: string,
  input: { kind: 'refresh_posts' | 'backfill'; since: string; until: string; pageIds?: string[] },
) {
  const response = await apiClient.post<CommonApiResponse<ReportRefresh>>(
    `${root(brandId)}/refresh`,
    input,
  )
  return response.data.data
}

export async function getReportRefresh(brandId: string, requestId: string) {
  const response = await apiClient.get<CommonApiResponse<ReportRefresh>>(
    `${root(brandId)}/refresh/${requestId}`,
  )
  return response.data.data
}

export async function createReport(
  brandId: string,
  input: { name: string; description?: string; config: ReportConfig },
) {
  const response = await apiClient.post<CommonApiResponse<SavedReport>>(root(brandId), input, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  return response.data.data
}

export async function updateReport(
  brandId: string,
  id: string,
  input: { name?: string; description?: string; config?: ReportConfig; version: number },
) {
  const response = await apiClient.patch<CommonApiResponse<SavedReport>>(
    `${root(brandId)}/${id}`,
    input,
  )
  return response.data.data
}

export async function duplicateReport(brandId: string, id: string) {
  const response = await apiClient.post<CommonApiResponse<SavedReport>>(
    `${root(brandId)}/${id}/duplicate`,
    {},
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
  )
  return response.data.data
}

export async function deleteReport(brandId: string, id: string) {
  await apiClient.delete(`${root(brandId)}/${id}`)
}

export async function exportReport(
  brandId: string,
  input: {
    config?: ReportConfig
    reportId?: string
    /** zip: every table as CSV files · xlsx: one sheet per table */
    format: 'zip' | 'xlsx'
    title?: string
  },
) {
  const response = await apiClient.post<Blob>(`${root(brandId)}/export`, input, {
    responseType: 'blob',
  })
  saveBlob(response.data, response.headers, `socialops-report.${input.format}`)
}

function saveBlob(data: Blob, headers: Record<string, unknown>, fallback: string) {
  const disposition = headers['content-disposition'] as string | undefined
  const filename = disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? fallback
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type PdfJob = {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  fileName: string
  errorCode: string | null
}

const PDF_POLL_MS = 1500
const PDF_TIMEOUT_MS = 3 * 60_000

/**
 * PDF is rendered in the background: start the job, poll until it finishes, then download the
 * file. Throws with the job's error code if rendering failed.
 */
export async function exportReportPdf(
  brandId: string,
  input: { config?: ReportConfig; reportId?: string; title?: string },
) {
  const started = await apiClient.post<CommonApiResponse<PdfJob>>(`${root(brandId)}/pdf`, input, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  let job = started.data.data
  const deadline = Date.now() + PDF_TIMEOUT_MS
  while (job.status === 'queued' || job.status === 'running') {
    if (Date.now() > deadline) throw new Error('REPORT_PDF_TIMEOUT')
    await new Promise((resolve) => window.setTimeout(resolve, PDF_POLL_MS))
    const response = await apiClient.get<CommonApiResponse<PdfJob>>(
      `${root(brandId)}/pdf/${job.id}`,
    )
    job = response.data.data
  }
  if (job.status === 'failed') throw new Error(job.errorCode ?? 'REPORT_PDF_FAILED')
  const file = await apiClient.get<Blob>(`${root(brandId)}/pdf/${job.id}/file`, {
    responseType: 'blob',
  })
  saveBlob(file.data, file.headers, job.fileName)
}

/** Creates a Google Sheets file in the user's Drive; needs their Google grant (409 otherwise). */
export async function exportReportSheets(
  brandId: string,
  input: { config?: ReportConfig; reportId?: string; title?: string },
  idempotencyKey: string,
) {
  const response = await apiClient.post<CommonApiResponse<{ spreadsheetId: string; url: string }>>(
    `${root(brandId)}/sheets`,
    input,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  return response.data.data
}

/** Prepared report for the PDF print page; authorized by the job's one-time token, not a session. */
export async function getReportPrintData(token: string) {
  const response = await apiClient.get<
    CommonApiResponse<{ document: ReportDocument; locale: string }>
  >(`/reports/print-data/${encodeURIComponent(token)}`)
  return response.data.data
}

import { apiClient } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type { ReportConfig, ReportDocument, ReportRefresh, ReportsList, SavedReport } from './types'
import type { CsvTable } from '../components/ReportExportMenu'

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
    /** csv: one table · zip: every table as CSV files · xlsx: one sheet per table */
    format: 'csv' | 'zip' | 'xlsx'
    table?: CsvTable
    title?: string
  },
) {
  const response = await apiClient.post<Blob>(`${root(brandId)}/export`, input, {
    responseType: 'blob',
  })
  const disposition = response.headers['content-disposition'] as string | undefined
  const filename =
    disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? `socialops-report.${input.format}`
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

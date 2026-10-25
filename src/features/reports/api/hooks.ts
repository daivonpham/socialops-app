import { useQuery } from '@tanstack/react-query'
import type { ReportConfig } from './types'
import { getReport, getReports, previewReport } from './service'

export const REPORT_QUERY_KEYS = {
  list: (brandId: string | null, page: number, search: string) =>
    ['reports', brandId, page, search] as const,
  detail: (brandId: string | null, id: string | null) => ['reports', brandId, id] as const,
  preview: (brandId: string | null, config: ReportConfig, postsPage: number, title: string) =>
    ['reports', brandId, 'preview', config, postsPage, title] as const,
}

export function useReports(brandId: string | null, page: number, search: string) {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.list(brandId, page, search),
    queryFn: () => getReports(brandId!, page, search),
    enabled: Boolean(brandId),
  })
}

export function useReport(brandId: string | null, id: string | null) {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.detail(brandId, id),
    queryFn: () => getReport(brandId!, id!),
    enabled: Boolean(brandId && id),
  })
}

export function useReportPreview(
  brandId: string | null,
  config: ReportConfig,
  postsPage = 1,
  title = '',
  enabled = true,
) {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.preview(brandId, config, postsPage, title),
    queryFn: () => previewReport(brandId!, config, postsPage, title),
    enabled: Boolean(brandId && enabled),
    staleTime: 30_000,
  })
}

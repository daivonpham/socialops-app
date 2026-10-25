import type { ReactNode } from 'react'
import {
  IconBarChart,
  IconCalendar,
  IconClock,
  IconFileText,
  IconGrid,
  IconImage,
  IconLayers,
  IconTable,
  IconTrendingUp,
} from '@/shared/ui'
import type { ReportSectionId } from '../api/types'

/** Icon shown next to each report section in the content step. */
export const SECTION_ICONS: Record<ReportSectionId, ReactNode> = {
  kpis: <IconGrid aria-hidden />,
  trends: <IconTrendingUp aria-hidden />,
  daily_table: <IconTable aria-hidden />,
  pages_table: <IconTable aria-hidden />,
  top_pages: <IconBarChart aria-hidden />,
  audience: <IconGrid aria-hidden />,
  content_mix: <IconLayers aria-hidden />,
  posts_table: <IconFileText aria-hidden />,
  top_posts: <IconImage aria-hidden />,
  bottom_posts: <IconImage aria-hidden />,
  best_times: <IconClock aria-hidden />,
  publishing_summary: <IconCalendar aria-hidden />,
  publishing_table: <IconTable aria-hidden />,
}

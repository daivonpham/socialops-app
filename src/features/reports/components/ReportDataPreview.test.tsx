import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ReportDocument } from '../api/types'
import { ReportDataPreview } from './ReportDataPreview'

const document: ReportDocument = {
  meta: {
    title: 'October',
    template: 'period_overview',
    brand: { id: 'b', name: 'Coffee Brand' },
    timeZone: 'Asia/Ho_Chi_Minh',
    period: { since: '2026-10-01', until: '2026-10-31', days: 31 },
    previousPeriod: null,
    generatedAt: '2026-11-01T00:00:00Z',
    pages: [{ id: '1', name: 'Coffee House' }],
  },
  freshness: {
    lastSyncedAt: null,
    postsMetricsUpdatedBefore: null,
    stalePosts: 0,
    missingRanges: [],
    activeRefresh: null,
  },
  notes: [],
  sections: [],
  tables: [
    {
      kind: 'kpis',
      name: 'Key metrics',
      columns: ['Metric', 'This period'],
      formats: ['text', 'number'],
      rowFormats: [
        ['text', 'number'],
        ['text', 'percent'],
        ['text', 'number'],
      ],
      rows: [
        ['Content views', 1200],
        ['Engagement rate', 0.125],
        ['Viewers', null],
      ],
    },
    {
      kind: 'posts',
      name: 'All posts',
      columns: ['Page', 'Link'],
      formats: ['text', 'url'],
      rows: [['Coffee House', 'https://facebook.com/1']],
      totalRows: 120,
    },
  ],
}

describe('ReportDataPreview', () => {
  it('lists every exported table with its row count and shows the first one', () => {
    render(<ReportDataPreview document={document} postsPage={1} onPostsPageChange={() => {}} />)
    const nav = screen.getByRole('navigation', { name: 'Export contents' })
    expect(within(nav).getByRole('button', { name: /Key metrics\s*3/ })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /All posts\s*120/ })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'This period' })).toBeInTheDocument()
    expect(screen.getByText('12.5%')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('switches tables and pages through posts that are only partly in the preview', async () => {
    const onPage = vi.fn()
    render(<ReportDataPreview document={document} postsPage={1} onPostsPageChange={onPage} />)
    await userEvent.click(screen.getByRole('button', { name: /All posts/ }))
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      'https://facebook.com/1',
    )
    expect(screen.getByText('Showing 1 of 120 rows · the export has all 120')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '›' }))
    expect(onPage).toHaveBeenCalledWith(2)
  })
})

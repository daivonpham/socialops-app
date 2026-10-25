import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { renderRoutes } from '@/test/render'
import { server } from '@/test/server'
import type { ReportDocument } from '../api/types'
import ReportPrintPage from './ReportPrintPage'

type PrintWindow = Window & { __REPORT_READY__?: boolean; __REPORT_ERROR__?: string }

const routes = [{ path: '/reports/print', element: <ReportPrintPage /> }]

const report: ReportDocument = {
  meta: {
    title: 'October performance',
    template: 'period_overview',
    brand: { id: 'brand-1', name: 'Coffee Brand' },
    timeZone: 'Asia/Ho_Chi_Minh',
    period: { since: '2026-10-01', until: '2026-10-31', days: 31 },
    previousPeriod: null,
    generatedAt: '2026-11-01T02:00:00.000Z',
    pages: [{ id: 'p1', name: 'Coffee House' }],
  },
  freshness: {
    lastSyncedAt: null,
    postsMetricsUpdatedBefore: null,
    stalePosts: 0,
    missingRanges: [],
    activeRefresh: null,
  },
  notes: [],
  sections: [
    {
      id: 'kpis',
      items: [{ metric: 'mediaViews', value: 252500, previous: 213600, changePct: 0.182 }],
    },
  ],
} as unknown as ReportDocument

describe('ReportPrintPage', () => {
  afterEach(() => {
    const win = window as PrintWindow
    delete win.__REPORT_READY__
    delete win.__REPORT_ERROR__
  })

  it('renders the cover from the print token and signals the PDF renderer', async () => {
    server.use(
      http.get('*/api/reports/print-data/:token', () =>
        HttpResponse.json({ data: { document: report, locale: 'en' } }),
      ),
    )
    renderRoutes(routes, { initialPath: '/reports/print?token=abc' })

    expect(await screen.findByRole('heading', { name: 'October performance' })).toBeInTheDocument()
    expect(screen.getByText('Coffee Brand')).toBeInTheDocument()
    await waitFor(() => expect((window as PrintWindow).__REPORT_READY__).toBe(true))
    expect((window as PrintWindow).__REPORT_ERROR__).toBeUndefined()
  })

  it('reports an expired token so the renderer fails fast', async () => {
    server.use(
      http.get('*/api/reports/print-data/:token', () =>
        HttpResponse.json({ error: { code: 'RESOURCE_NOT_FOUND' } }, { status: 404 }),
      ),
    )
    renderRoutes(routes, { initialPath: '/reports/print?token=old' })

    expect(
      await screen.findByText('This report print link is invalid or has expired.'),
    ).toBeInTheDocument()
    expect((window as PrintWindow).__REPORT_ERROR__).toBe('print-data')
    expect((window as PrintWindow).__REPORT_READY__).toBe(true)
  })
})

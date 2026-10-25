import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/test/server'
import { exportReportPdf } from './service'

const job = (status: string, errorCode: string | null = null) => ({
  data: { id: 'job-1', status, fileName: 'socialops-coffee.pdf', errorCode },
})

describe('exportReportPdf', () => {
  const click = vi.fn()
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:pdf')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    click.mockReset()
  })

  it('starts the job with an Idempotency-Key, waits for it and downloads the file', async () => {
    let idempotencyKey: string | null = null
    let polls = 0
    server.use(
      http.post('*/api/brands/:brandId/reports/pdf', ({ request }) => {
        idempotencyKey = request.headers.get('Idempotency-Key')
        return HttpResponse.json(job('queued'))
      }),
      http.get('*/api/brands/:brandId/reports/pdf/:jobId', () => {
        polls += 1
        return HttpResponse.json(job('completed'))
      }),
      http.get(
        '*/api/brands/:brandId/reports/pdf/:jobId/file',
        () =>
          new HttpResponse('%PDF-1.7', {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="socialops-coffee.pdf"',
            },
          }),
      ),
    )

    await exportReportPdf('brand-1', { title: 'October' })

    expect(idempotencyKey).toBeTruthy()
    expect(polls).toBe(1)
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('fails with the job error code and downloads nothing', async () => {
    server.use(
      http.post('*/api/brands/:brandId/reports/pdf', () =>
        HttpResponse.json(job('failed', 'REPORT_PDF_UNAVAILABLE')),
      ),
    )
    await expect(exportReportPdf('brand-1', {})).rejects.toThrow('REPORT_PDF_UNAVAILABLE')
    expect(click).not.toHaveBeenCalled()
  })
})

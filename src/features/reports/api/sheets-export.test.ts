import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { needsGoogleConsent } from '@/features/google'
import { server } from '@/test/server'
import { exportReportSheets } from './service'

describe('exportReportSheets', () => {
  it('sends the Idempotency-Key and returns the new spreadsheet', async () => {
    let key: string | null = null
    server.use(
      http.post('*/api/brands/:brandId/reports/sheets', ({ request }) => {
        key = request.headers.get('Idempotency-Key')
        return HttpResponse.json({
          data: {
            spreadsheetId: 'sheet-1',
            url: 'https://docs.google.test/spreadsheets/d/sheet-1',
          },
        })
      }),
    )
    await expect(exportReportSheets('brand-1', { title: 'October' }, 'key-1')).resolves.toEqual({
      spreadsheetId: 'sheet-1',
      url: 'https://docs.google.test/spreadsheets/d/sheet-1',
    })
    expect(key).toBe('key-1')
  })

  it('surfaces a missing Google grant so the app can ask for consent', async () => {
    server.use(
      http.post('*/api/brands/:brandId/reports/sheets', () =>
        HttpResponse.json(
          { error: { code: 'GOOGLE_REAUTHORIZATION_REQUIRED', message: 'x' }, requestId: 'r' },
          { status: 409 },
        ),
      ),
    )
    const failure = await exportReportSheets('brand-1', {}, 'key-2').catch(
      (error: unknown) => error,
    )
    expect(needsGoogleConsent(failure)).toBe(true)
  })
})

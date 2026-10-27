import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/test/server'
import { connectGoogleInPopup, reportGoogleOAuthResult } from './connect'

describe('connectGoogleInPopup', () => {
  const popup = { closed: false, close: vi.fn(), location: { href: 'about:blank' } }
  beforeEach(() => {
    popup.closed = false
    popup.location.href = 'about:blank'
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    server.use(
      http.post('*/api/users/me/integrations/google/connect', () =>
        HttpResponse.json({ data: { authorizationUrl: 'https://accounts.google.test/auth' } }),
      ),
    )
  })
  afterEach(() => vi.restoreAllMocks())

  it('opens the popup at once, sends it to Google and resolves with the callback result', async () => {
    const result = connectGoogleInPopup()
    // Opened synchronously so the browser treats it as part of the click.
    expect(window.open).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(popup.location.href).toBe('https://accounts.google.test/auth'))
    // The callback page reports over a BroadcastChannel, which survives Google cutting `opener`.
    reportGoogleOAuthResult({ email: 'marketer@gmail.test' })
    await expect(result).resolves.toMatchObject({ email: 'marketer@gmail.test' })
  })

  it('rejects with the error the callback page reports', async () => {
    const result = connectGoogleInPopup()
    reportGoogleOAuthResult({ error: 'GOOGLE_PERMISSION_MISSING' })
    await expect(result).rejects.toThrow('GOOGLE_PERMISSION_MISSING')
  })
})

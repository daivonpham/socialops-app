import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/shared/i18n'
import { CLIENT_ERROR_CODES, CodedError } from '@/shared/api/errors'
import { translateApiError } from './useApiErrorMessage'

function apiError(status: number, code?: string) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('Request failed', undefined, config, undefined, {
    status,
    statusText: '',
    headers: {},
    config,
    data: code ? { error: { code, message: 'Server wording' }, requestId: 'req' } : undefined,
  })
}

describe('translateApiError', () => {
  it('translates a known code from the shared namespace', () => {
    expect(translateApiError(i18n, apiError(409, 'ALREADY_WORKSPACE_MEMBER'))).toBe(
      'This person is already a member of the workspace.',
    )
  })

  it('prefers the feature namespace override', () => {
    expect(translateApiError(i18n, apiError(400, 'GOOGLE_AUTH_FAILED'), { ns: 'auth' })).toBe(
      i18n.t('errors.GOOGLE_AUTH_FAILED', { ns: 'auth' }),
    )
  })

  it('uses the screen fallback for unknown or generic codes', () => {
    expect(
      translateApiError(i18n, apiError(409, 'SOMETHING_NEW'), { fallback: 'Could not save' }),
    ).toBe('Could not save')
    expect(translateApiError(i18n, apiError(500), { fallback: 'Could not save' })).toBe(
      'Could not save',
    )
    expect(translateApiError(i18n, new Error('boom'))).toBe(
      'Something went wrong. Please try again.',
    )
  })

  it('keeps actionable transport and status codes over the fallback', () => {
    expect(
      translateApiError(i18n, new AxiosError('offline', 'ERR_NETWORK'), { fallback: 'x' }),
    ).toBe('Cannot reach the server. Check your connection and try again.')
    expect(translateApiError(i18n, apiError(429), { fallback: 'x' })).toBe(
      'Too many requests. Wait a moment and try again.',
    )
    expect(translateApiError(i18n, new CodedError('REPORT_PDF_TIMEOUT'))).toBe(
      'The PDF is taking too long. Please try again.',
    )
  })

  it('never renders the server message', () => {
    expect(translateApiError(i18n, apiError(409, 'SOMETHING_NEW'))).not.toContain('Server wording')
  })
})

describe('errors namespace', () => {
  it.each(['en-US', 'vi-VN'])('translates every client code in %s', (locale) => {
    const missing = Object.values(CLIENT_ERROR_CODES).filter(
      (code) => !i18n.exists(`errors:codes.${code}`, { lng: locale }),
    )
    expect(missing).toEqual([])
  })
})

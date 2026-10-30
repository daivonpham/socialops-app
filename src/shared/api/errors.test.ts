import { AxiosError, AxiosHeaders, CanceledError } from 'axios'
import { describe, expect, it } from 'vitest'
import { CodedError, getApiError, isApiErrorCode, isCancelledError } from './errors'

function httpError(status: number, data?: unknown, code?: string) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('Request failed', code, config, undefined, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  })
}

describe('getApiError', () => {
  it('reads the API envelope', () => {
    const error = httpError(409, {
      error: { code: 'CONTENT_VERSION_CONFLICT', message: 'Changed', fields: [] },
      requestId: 'req-1',
    })
    expect(getApiError(error)).toEqual({
      kind: 'api',
      code: 'CONTENT_VERSION_CONFLICT',
      status: 409,
      message: 'Changed',
      fields: [],
      requestId: 'req-1',
    })
  })

  it.each([
    [400, 'VALIDATION_FAILED'],
    [401, 'AUTHENTICATION_REQUIRED'],
    [403, 'FORBIDDEN'],
    [404, 'RESOURCE_NOT_FOUND'],
    [409, 'RESOURCE_CONFLICT'],
    [413, 'PAYLOAD_TOO_LARGE'],
    [429, 'RATE_LIMIT_EXCEEDED'],
    [502, 'SERVICE_UNAVAILABLE'],
    [503, 'SERVICE_UNAVAILABLE'],
    [504, 'SERVICE_UNAVAILABLE'],
    [500, 'INTERNAL_ERROR'],
    [418, 'HTTP_ERROR'],
  ])('derives a code from status %i without an envelope', (status, code) => {
    expect(getApiError(httpError(status, '<html>Bad gateway</html>'))).toMatchObject({
      kind: 'http',
      code,
      status,
    })
  })

  it('separates offline, timeout and cancelled requests', () => {
    expect(getApiError(new AxiosError('Network Error', 'ERR_NETWORK')).code).toBe('NETWORK_ERROR')
    expect(getApiError(new AxiosError('timeout', 'ECONNABORTED')).code).toBe('TIMEOUT')
    const cancelled = new CanceledError()
    expect(getApiError(cancelled).kind).toBe('cancelled')
    expect(isCancelledError(cancelled)).toBe(true)
    expect(isCancelledError(new DOMException('aborted', 'AbortError'))).toBe(true)
  })

  it('keeps codes raised in the app and falls back to UNKNOWN', () => {
    expect(getApiError(new CodedError('REPORT_PDF_TIMEOUT')).code).toBe('REPORT_PDF_TIMEOUT')
    expect(getApiError(new Error('boom')).code).toBe('UNKNOWN')
    expect(getApiError(undefined).code).toBe('UNKNOWN')
  })
})

describe('isApiErrorCode', () => {
  it('matches one or several codes', () => {
    const error = httpError(409, { error: { code: 'ALREADY_WORKSPACE_MEMBER', message: '' } })
    expect(isApiErrorCode(error, 'ALREADY_WORKSPACE_MEMBER')).toBe(true)
    expect(isApiErrorCode(error, ['INVITATION_EXPIRED', 'ALREADY_WORKSPACE_MEMBER'])).toBe(true)
    expect(isApiErrorCode(error, 'INVITATION_EXPIRED')).toBe(false)
  })
})

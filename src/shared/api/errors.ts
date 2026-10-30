import { isAxiosError, isCancel } from 'axios'
import type { ApiErrorResponse } from './types'

/**
 * One reader for every failed request. The API sends `{ error: { code, message, fields } }`
 * (see socialops-api `http/errors/catalog`); anything else (proxy pages, offline, timeouts,
 * aborted requests, client-side failures) is normalized to a stable code too, so callers only
 * ever branch on `code` and translate it through `useApiErrorMessage`.
 */

/** Codes the app produces itself or derives from an HTTP status when the body has none. */
export const CLIENT_ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  HTTP_ERROR: 'HTTP_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',
  UNKNOWN: 'UNKNOWN',
} as const

export type ApiErrorKind =
  /** The API answered with its error envelope. */
  | 'api'
  /** A response arrived without the envelope (gateway, proxy, static host). */
  | 'http'
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'unknown'

export type ApiErrorField = { field: string; code: string; message?: string }

export type ApiError = {
  kind: ApiErrorKind
  code: string
  status?: number
  /** Server wording, English, for logs only; never render it. */
  message?: string
  fields: ApiErrorField[]
  requestId?: string
}

/** A failure raised in the app (polling timeout, cancelled popup) that still carries a code. */
export class CodedError extends Error {
  readonly code: string

  constructor(code: string, options?: { cause?: unknown }) {
    super(code, options)
    this.name = 'CodedError'
    this.code = code
  }
}

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/

/**
 * Reads a code from an untrusted place (OAuth callback query, popup message). Anything that is not
 * a plain error code becomes `fallback`.
 */
export function parseErrorCode(value: unknown, fallback: string = CLIENT_ERROR_CODES.UNKNOWN) {
  return typeof value === 'string' && CODE_PATTERN.test(value) ? value : fallback
}

const STATUS_CODES: Record<number, string> = {
  400: CLIENT_ERROR_CODES.VALIDATION_FAILED,
  401: CLIENT_ERROR_CODES.AUTHENTICATION_REQUIRED,
  403: CLIENT_ERROR_CODES.FORBIDDEN,
  404: CLIENT_ERROR_CODES.RESOURCE_NOT_FOUND,
  409: CLIENT_ERROR_CODES.RESOURCE_CONFLICT,
  413: CLIENT_ERROR_CODES.PAYLOAD_TOO_LARGE,
  415: CLIENT_ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
  429: CLIENT_ERROR_CODES.RATE_LIMIT_EXCEEDED,
  502: CLIENT_ERROR_CODES.SERVICE_UNAVAILABLE,
  503: CLIENT_ERROR_CODES.SERVICE_UNAVAILABLE,
  504: CLIENT_ERROR_CODES.SERVICE_UNAVAILABLE,
}

function codeForStatus(status: number) {
  return (
    STATUS_CODES[status] ??
    (status >= 500 ? CLIENT_ERROR_CODES.INTERNAL_ERROR : CLIENT_ERROR_CODES.HTTP_ERROR)
  )
}

function envelope(data: unknown): ApiErrorResponse | undefined {
  if (!data || typeof data !== 'object' || !('error' in data)) return undefined
  const { error } = data as Partial<ApiErrorResponse>
  return error && typeof error.code === 'string' ? (data as ApiErrorResponse) : undefined
}

export function isCancelledError(error: unknown): boolean {
  return (
    isCancel(error) ||
    (isAxiosError(error) && error.code === 'ERR_CANCELED') ||
    (error instanceof DOMException && error.name === 'AbortError')
  )
}

/** Normalizes any thrown value; never throws and always returns a code. */
export function getApiError(error: unknown): ApiError {
  if (isCancelledError(error))
    return { kind: 'cancelled', code: CLIENT_ERROR_CODES.CANCELLED, fields: [] }
  if (error instanceof CodedError) return { kind: 'unknown', code: error.code, fields: [] }
  if (!isAxiosError(error)) return { kind: 'unknown', code: CLIENT_ERROR_CODES.UNKNOWN, fields: [] }

  const response = error.response
  if (!response) {
    const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
    return timedOut
      ? { kind: 'timeout', code: CLIENT_ERROR_CODES.TIMEOUT, fields: [] }
      : { kind: 'network', code: CLIENT_ERROR_CODES.NETWORK_ERROR, fields: [] }
  }
  const body = envelope(response.data)
  if (!body)
    return {
      kind: 'http',
      code: codeForStatus(response.status),
      status: response.status,
      fields: [],
    }
  return {
    kind: 'api',
    code: body.error.code,
    status: response.status,
    message: body.error.message,
    fields: body.error.fields ?? [],
    requestId: body.requestId,
  }
}

export function getApiErrorCode(error: unknown): string {
  return getApiError(error).code
}

/** True when the failure carries `code` (or one of `codes`). */
export function isApiErrorCode(error: unknown, codes: string | readonly string[]): boolean {
  const code = getApiErrorCode(error)
  return typeof codes === 'string' ? code === codes : codes.includes(code)
}

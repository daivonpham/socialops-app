import type { FlatNamespace, i18n as I18n } from 'i18next'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CLIENT_ERROR_CODES, getApiError } from '@/shared/api/errors'

/** Codes that say nothing about the action; the screen's own fallback reads better. */
const GENERIC_CODES = new Set<string>([
  CLIENT_ERROR_CODES.UNKNOWN,
  CLIENT_ERROR_CODES.INTERNAL_ERROR,
  CLIENT_ERROR_CODES.HTTP_ERROR,
  CLIENT_ERROR_CODES.VALIDATION_FAILED,
])

export type ApiErrorMessageOptions = {
  /** Feature namespace whose `errors.<CODE>` keys override the shared wording. */
  ns?: FlatNamespace
  /** Screen-specific sentence used when the code is unknown or generic. */
  fallback?: string
}

/**
 * Message for any thrown value: `<ns>:errors.<CODE>`, then `errors:codes.<CODE>`, then the
 * fallback, then `errors:codes.UNKNOWN`. Never returns the server's English message.
 */
export function translateApiError(
  i18n: I18n,
  error: unknown,
  { ns, fallback }: ApiErrorMessageOptions = {},
): string {
  const { code } = getApiError(error)
  const t = i18n.t.bind(i18n) as (key: string) => string
  if (ns && i18n.exists(`${ns}:errors.${code}`)) return t(`${ns}:errors.${code}`)
  if (fallback && GENERIC_CODES.has(code)) return fallback
  if (i18n.exists(`errors:codes.${code}`)) return t(`errors:codes.${code}`)
  return fallback ?? t('errors:codes.UNKNOWN')
}

/**
 * `const errorMessage = useApiErrorMessage('workspaces')` then
 * `toast.error({ title: errorMessage(error, t('toast.createError')) })`.
 */
export function useApiErrorMessage(ns?: FlatNamespace) {
  const { i18n } = useTranslation()
  return useCallback(
    (error: unknown, fallback?: string) => translateApiError(i18n, error, { ns, fallback }),
    [i18n, ns],
  )
}

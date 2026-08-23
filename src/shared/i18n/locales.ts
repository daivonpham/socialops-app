export const SUPPORTED_LOCALES = ['en-US', 'vi-VN'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
export type TextDirection = 'ltr' | 'rtl'

export const DEFAULT_LOCALE: AppLocale = 'en-US'

export const LOCALE_META: Record<AppLocale, { direction: TextDirection; dayjsLocale: string }> = {
  'en-US': { direction: 'ltr', dayjsLocale: 'en' },
  'vi-VN': { direction: 'ltr', dayjsLocale: 'vi' },
}

const PREFERENCES_STORAGE_KEY = 'socialops.preferences:v1'

export function normalizeLocale(value: string | null | undefined): AppLocale | null {
  if (!value) return null
  const exact = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === value.toLowerCase())
  if (exact) return exact

  const language = value.split('-')[0]?.toLowerCase()
  return SUPPORTED_LOCALES.find((locale) => locale.toLowerCase().startsWith(`${language}-`)) ?? null
}

export function resolveLocale(value: string | null | undefined): AppLocale {
  return normalizeLocale(value) ?? DEFAULT_LOCALE
}

export function detectInitialLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (raw) {
      const persisted = JSON.parse(raw) as { locale?: string }
      const locale = normalizeLocale(persisted.locale)
      if (locale) return locale
    }
  } catch {
    // Unavailable or corrupted storage falls through to the browser preference.
  }

  for (const language of navigator.languages) {
    const locale = normalizeLocale(language)
    if (locale) return locale
  }
  return DEFAULT_LOCALE
}

export function persistLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ locale }))
  } catch {
    // Locale remains active for this session when storage is unavailable.
  }
}

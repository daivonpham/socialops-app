import { createInstance, type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LOCALE, detectInitialLocale, SUPPORTED_LOCALES } from './locales'

export const i18n = createInstance()

export async function initializeI18n(resources: Resource) {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng: detectInitialLocale(),
      supportedLngs: [...SUPPORTED_LOCALES],
      fallbackLng: DEFAULT_LOCALE,
      defaultNS: 'common',
      fallbackNS: 'common',
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    })
  }
  return i18n
}

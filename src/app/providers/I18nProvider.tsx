import { useEffect, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { applyDocumentLocale } from '@/app/i18n'
import { i18n, persistLocale, resolveLocale } from '@/shared/i18n'

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const syncLocale = (language: string) => {
      persistLocale(resolveLocale(language))
      applyDocumentLocale()
    }

    i18n.on('languageChanged', syncLocale)
    return () => {
      i18n.off('languageChanged', syncLocale)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}


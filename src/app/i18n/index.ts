import { i18n, initializeI18n, LOCALE_META, resolveLocale } from '@/shared/i18n'
import { resources } from './resources'

export async function initializeAppI18n() {
  await initializeI18n(resources)
  applyDocumentLocale()
}

export function applyDocumentLocale() {
  const locale = resolveLocale(i18n.resolvedLanguage ?? i18n.language)
  document.documentElement.lang = locale
  document.documentElement.dir = LOCALE_META[locale].direction
  document.title = i18n.t('document.title', { ns: 'app' })
}

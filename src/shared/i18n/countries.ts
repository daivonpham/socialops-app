import { resolveLocale } from './locales'

const COUNTRY_NAMES = new Map<string, Intl.DisplayNames>()

function getCountryNames(locale: string): Intl.DisplayNames {
  const resolvedLocale = resolveLocale(locale)
  let names = COUNTRY_NAMES.get(resolvedLocale)
  if (!names) {
    names = new Intl.DisplayNames([resolvedLocale], { type: 'region' })
    COUNTRY_NAMES.set(resolvedLocale, names)
  }
  return names
}

export function formatCountryLabel(countryCode: string, locale?: string | null): string {
  const code = countryCode.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return countryCode

  const flag = String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)))
  const name = getCountryNames(locale ?? '').of(code) ?? code
  return `${flag} ${name}`
}

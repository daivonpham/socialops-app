import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

/** Validates international numbers and local numbers using the supplied default country. */
export function isValidPhone(value: unknown, defaultCountry: CountryCode = 'VN'): boolean {
  if (typeof value !== 'string') return false
  const normalized = value.trim()
  if (!normalized) return false
  return parsePhoneNumberFromString(normalized, defaultCountry)?.isValid() ?? false
}

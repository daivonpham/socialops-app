import { resolveLocale } from './locales'

/**
 * Vietnamese names of the places Meta writes in English. Meta mixes the two ("Biên Hòa, Đồng Nai
 * Province" next to "Hanoi"), so only the English ones need a name here.
 */
const VI_NAMES: Record<string, string> = {
  'ho chi minh city': 'Thành phố Hồ Chí Minh',
  hanoi: 'Hà Nội',
  'ha noi': 'Hà Nội',
  'da nang': 'Đà Nẵng',
  danang: 'Đà Nẵng',
  'hai phong': 'Hải Phòng',
  haiphong: 'Hải Phòng',
  'can tho': 'Cần Thơ',
  hue: 'Huế',
}

/** "Quảng Nam" and "Quang Nam" are the same place. */
function plain(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Mark}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, '')
}

/** More letters with diacritics: the name as written locally. */
function accents(value: string): number {
  return value.normalize('NFD').replace(/[^\p{Mark}đĐ]/gu, '').length
}

/**
 * A city as Meta names it ("Biên Hòa, Đồng Nai Province, Vietnam") shortened the way Facebook
 * shows it ("Biên Hòa, Đồng Nai"): the country goes, "Province" goes, a city named like its
 * province appears once, and in Vietnamese the English names are translated.
 */
export function formatCityLabel(name: string, locale?: string | null): string {
  const parts = name
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  // Meta always ends with the country; a lone name has none.
  const place = parts.length > 1 ? parts.slice(0, -1) : parts
  const vietnamese = resolveLocale(locale ?? '') === 'vi-VN'
  const named = place.map((part) => {
    const short = part.replace(/\s+Province$/i, '').trim() || part
    return (vietnamese ? VI_NAMES[short.toLowerCase()] : undefined) ?? short
  })
  const unique: string[] = []
  for (const part of named) {
    const previous = unique.at(-1)
    if (previous !== undefined && plain(previous) === plain(part)) {
      if (accents(part) > accents(previous)) unique[unique.length - 1] = part
      continue
    }
    unique.push(part)
  }
  return unique.join(', ') || name
}

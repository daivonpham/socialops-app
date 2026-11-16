/**
 * The caption as a Page shows it. Captions are kept as written, Markdown included, so the app can
 * show the formatting; Facebook shows only plain text, so its marks are taken off when the caption
 * leaves for the Page. Line breaks stay where they are.
 *
 * Mirrors `toPlainCaption` in socialops-api (`modules/planning/plain-caption.ts`): the app shows
 * what the Page will show. Change both together.
 *
 * Only marks that read as noise are removed. A `#` with no space after it is a hashtag, and an
 * underscore inside a word (`#Khoe_Manh`, `ten_file`) is part of it, so both stay.
 */
const WORD = '[\\p{L}\\p{N}_]'

const INLINE: Array<[RegExp, string]> = [
  // Images and links: keep the words, and the address when it is not the words themselves.
  [/!\[([^\]\n]*)\]\([^)\s]*(?:\s+"[^"]*")?\)/gu, '$1'],
  [/<(https?:\/\/[^>\s]+)>/gu, '$1'],
  // Bold, strike-through, italics, inline code.
  [/\*\*(?=\S)([^\n]*?\S)\*\*/gu, '$1'],
  [new RegExp(`(^|[^\\p{L}\\p{N}])__(?=\\S)([^\\n]*?\\S)__(?!${WORD})`, 'gu'), '$1$2'],
  [/~~(?=\S)([^\n]*?\S)~~/gu, '$1'],
  [
    new RegExp(`(^|[^\\p{L}\\p{N}*])\\*(?=[^\\s*])([^*\\n]*?[^\\s*])\\*(?![\\p{L}\\p{N}*])`, 'gu'),
    '$1$2',
  ],
  [new RegExp(`(^|[^\\p{L}\\p{N}_])_(?=[^\\s_])([^_\\n]*?[^\\s_])_(?!${WORD})`, 'gu'), '$1$2'],
  [/`([^`\n]+)`/gu, '$1'],
]

/*
 * A backslash keeps a mark from being read as one (`\*` is a star). Such marks are moved out of the
 * way, to a private-use character, before the rules run, and come back as the bare mark after.
 */
const PRIVATE = 0xe000
const hideEscapes = (line: string): string =>
  line.replace(/\\([`*_{}[\]()#+\-.!~>|])/gu, (_, mark: string) =>
    String.fromCharCode(PRIVATE + mark.charCodeAt(0)),
  )
const restoreEscapes = (line: string): string =>
  line.replace(/[\ue000-\ue07f]/gu, (char) => String.fromCharCode(char.charCodeAt(0) - PRIVATE))

function plainLink(text: string, url: string): string {
  return text === url || !url ? text : `${text} (${url})`
}

function plainLine(line: string): string {
  let out = hideEscapes(line)
    .replace(/^\s{0,3}#{1,6}\s+(.*?)(?:\s+#+)?\s*$/u, '$1')
    .replace(/^(\s{0,3}>)+\s?/u, '')
    .replace(/^(\s*)[-*+]\s+\[[ xX]\]\s+/u, '$1• ')
    .replace(/^(\s*)[-*+]\s+/u, '$1• ')
  out = out.replace(
    /(?<!!)\[([^\]\n]+)\]\(([^)\s]*)(?:\s+"[^"]*")?\)/gu,
    (_, text: string, url: string) => plainLink(text, url),
  )
  for (const [pattern, replacement] of INLINE) out = out.replace(pattern, replacement)
  return restoreEscapes(out)
}

export function toPlainCaption(caption: string): string {
  const lines = caption.split('\n')
  const result: string[] = []
  let inFence = false
  for (const line of lines) {
    if (/^\s{0,3}(```|~~~)/u.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) result.push(line)
    else if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/u.test(line)) result.push('')
    else if (/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/u.test(line)) continue
    else result.push(plainLine(line))
  }
  return result.join('\n')
}

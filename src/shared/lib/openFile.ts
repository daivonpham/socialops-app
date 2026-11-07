export type FileKind = 'image' | 'pdf' | 'word' | 'excel' | 'text' | 'other'

const KIND_BY_EXTENSION: Record<string, FileKind> = {
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  webp: 'image',
  gif: 'image',
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  xls: 'excel',
  xlsx: 'excel',
  csv: 'excel',
  txt: 'text',
}

export const fileExtensionOf = (name: string): string => {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/** By extension first, since browsers often leave the type of Office files empty. */
export function fileKindOf(name: string, mimeType = ''): FileKind {
  const byExtension = KIND_BY_EXTENSION[fileExtensionOf(name)]
  if (byExtension) return byExtension
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('text/')) return 'text'
  return 'other'
}

/** Online viewers fetch the file themselves, so they only work for a public web address. */
const isWebUrl = (url: string): boolean => /^https?:\/\//i.test(url)

function openInNewTab(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function download(url: string, name: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.rel = 'noopener'
  link.click()
}

/**
 * Opens a non-image file the way its kind reads best: PDF and text in a new tab, Word in Google
 * Docs Viewer, Excel in Office Online. A file not on the web yet (a `blob:` URL picked in this
 * browser) cannot reach those viewers, so Word, Excel and unknown kinds are downloaded instead.
 * Images are shown with the image preview, not here.
 */
export function openFile({
  url,
  name,
  mimeType,
}: {
  url: string
  name: string
  mimeType?: string
}) {
  const kind = fileKindOf(name, mimeType)
  if (kind === 'pdf' || kind === 'text' || kind === 'image') return openInNewTab(url)
  if (kind === 'word' && isWebUrl(url))
    return openInNewTab(
      `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`,
    )
  if (kind === 'excel' && isWebUrl(url))
    return openInNewTab(
      `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`,
    )
  download(url, name)
}

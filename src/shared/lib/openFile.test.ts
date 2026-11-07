import { afterEach, describe, expect, it, vi } from 'vitest'
import { fileKindOf, openFile } from './openFile'

describe('openFile', () => {
  afterEach(() => vi.restoreAllMocks())

  it('tells the kind by extension, then by type', () => {
    expect(fileKindOf('Bao-gia.PDF')).toBe('pdf')
    expect(fileKindOf('ke-hoach.docx', '')).toBe('word')
    expect(fileKindOf('so-lieu.xlsx')).toBe('excel')
    expect(fileKindOf('anh', 'image/png')).toBe('image')
    expect(fileKindOf('noname')).toBe('other')
  })

  it('opens a PDF in a new tab', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    openFile({ url: 'https://cdn.example.com/a.pdf', name: 'a.pdf' })
    expect(open).toHaveBeenCalledWith(
      'https://cdn.example.com/a.pdf',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('opens Word and Excel on the web in their viewers', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    openFile({ url: 'https://cdn.example.com/a b.docx', name: 'a b.docx' })
    openFile({ url: 'https://cdn.example.com/s.xlsx', name: 's.xlsx' })
    expect(open).toHaveBeenNthCalledWith(
      1,
      'https://docs.google.com/gview?url=https%3A%2F%2Fcdn.example.com%2Fa%20b.docx&embedded=true',
      '_blank',
      'noopener,noreferrer',
    )
    expect(open).toHaveBeenNthCalledWith(
      2,
      'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fcdn.example.com%2Fs.xlsx',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('downloads Word from this browser, since a viewer cannot reach it', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    openFile({ url: 'blob:http://localhost/1', name: 'ke-hoach.docx' })
    expect(open).not.toHaveBeenCalled()
    expect(click).toHaveBeenCalledOnce()
  })
})

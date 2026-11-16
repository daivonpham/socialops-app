import { describe, expect, it } from 'vitest'
import { toPlainCaption } from './plainCaption'

describe('toPlainCaption', () => {
  it('takes off bold, italics, strike-through and code, keeping the words', () => {
    expect(toPlainCaption('**Khỏe mạnh** mỗi *ngày* với __gym__, ~~cũ~~ và `code`')).toBe(
      'Khỏe mạnh mỗi ngày với gym, cũ và code',
    )
  })

  it('keeps line breaks and blank lines where they are', () => {
    expect(toPlainCaption('Dòng 1\nDòng 2\n\n**Dòng 4**')).toBe('Dòng 1\nDòng 2\n\nDòng 4')
  })

  it('keeps hashtags, and underscores inside words', () => {
    const text = '#TapGym #Khoe_Manh ten_file_moi 5*3*2'
    expect(toPlainCaption(text)).toBe(text)
  })

  it('turns headings, quotes and bullets into plain lines', () => {
    expect(toPlainCaption('## Ưu đãi\n> Trích dẫn\n- Một\n* Hai\n+ Ba\n1. Bốn')).toBe(
      'Ưu đãi\nTrích dẫn\n• Một\n• Hai\n• Ba\n1. Bốn',
    )
  })

  it('keeps a link address the reader would lose otherwise', () => {
    expect(toPlainCaption('Xem [thực đơn](https://a.vn/menu) hoặc <https://a.vn>')).toBe(
      'Xem thực đơn (https://a.vn/menu) hoặc https://a.vn',
    )
    expect(toPlainCaption('[https://a.vn](https://a.vn)')).toBe('https://a.vn')
  })

  it('drops code fences and rules, keeping the lines between', () => {
    expect(toPlainCaption('```\nGiờ mở cửa: 8h\n```\n---\nHết')).toBe('Giờ mở cửa: 8h\n\nHết')
  })

  it('leaves plain text untouched', () => {
    const text = 'Một buổi tập 💪✨\nGhé phòng tập nhé! 🚀 #TapGym'
    expect(toPlainCaption(text)).toBe(text)
  })

  it('keeps an escaped mark as the mark', () => {
    expect(toPlainCaption('Giảm 50% cho \\*thành viên\\* \\#1')).toBe(
      'Giảm 50% cho *thành viên* #1',
    )
  })
})

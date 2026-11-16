import { describe, expect, it } from 'vitest'
import { matchesSearch, normalizeSearch } from './search'

describe('normalizeSearch', () => {
  it('drops Vietnamese marks, "đ", case and extra spaces', () => {
    expect(normalizeSearch('  Anh Thợ   ĐẦU Quăn ')).toBe('anh tho dau quan')
  })
})

describe('matchesSearch', () => {
  it.each([
    ['anh thợ đầu quăn', 'tho dau'],
    ['anh thợ đầu quăn', 'Thợ Đầu'],
    ['Thương hiệu cho AI test', 'thuong hieu'],
    ['Đà Nẵng', 'da nang'],
    ['conffe house', 'HOUSE'],
  ])('finds %s by %s', (text, query) => {
    expect(matchesSearch(text, query)).toBe(true)
  })

  it('does not match other text', () => {
    expect(matchesSearch('Hà Nội', 'ho chi minh')).toBe(false)
  })

  it('matches everything for an empty query', () => {
    expect(matchesSearch('anything', '   ')).toBe(true)
    expect(matchesSearch(undefined, '')).toBe(true)
  })
})

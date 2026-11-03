import { describe, expect, it } from 'vitest'
import { formatCompact, formatDayMonth, formatPercent, formatSigned, formatSlot } from './format'

describe('dashboard number formatting', () => {
  it('keeps full numbers below 10,000 and shortens larger ones', () => {
    expect(formatCompact(2403, 'vi-VN')).toBe('2.403')
    expect(formatCompact(18_500, 'vi-VN')).toBe('18,5K')
    expect(formatCompact(1_234_000, 'en-US')).toBe('1.2M')
  })

  it('signs gains and formats rates and slots', () => {
    expect(formatSigned(1278, 'vi-VN')).toBe('+1.278')
    expect(formatSigned(-431, 'vi-VN')).toBe('-431')
    expect(formatPercent(5.65, 'vi-VN')).toBe('5,65%')
    expect(formatDayMonth('2026-10-09')).toBe('09/10')
    expect(formatSlot(10)).toEqual({ from: '20h', to: '22h' })
  })
})

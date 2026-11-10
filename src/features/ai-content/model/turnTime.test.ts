import { describe, expect, it } from 'vitest'
import { turnTimeAgo } from './turnTime'

const NOW = Date.parse('2026-11-09T10:00:00.000Z')
const ago = (ms: number): string => new Date(NOW - ms).toISOString()

describe('turnTimeAgo', () => {
  it('leaves the first minute to the "just now" wording', () => {
    expect(turnTimeAgo(ago(59_000), NOW, 'en-US')).toBeNull()
    expect(turnTimeAgo(ago(-5_000), NOW, 'en-US')).toBeNull()
  })

  it('counts minutes, then hours, in the language shown', () => {
    expect(turnTimeAgo(ago(5 * 60_000), NOW, 'en-US')).toBe('5 minutes ago')
    expect(turnTimeAgo(ago(3 * 3_600_000), NOW, 'vi-VN')).toBe('3 giờ trước')
  })

  it('gives the date from a day on', () => {
    expect(turnTimeAgo(ago(26 * 3_600_000), NOW, 'en-US')).toMatch(/11\/08\/2026/)
  })
})

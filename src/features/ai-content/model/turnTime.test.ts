import { describe, expect, it } from 'vitest'
import { turnDuration } from './turnTime'

const START = '2026-11-09T10:00:00.000Z'
const after = (ms: number): string => new Date(Date.parse(START) + ms).toISOString()

describe('turnDuration', () => {
  it('reads minutes and seconds in the language shown', () => {
    expect(turnDuration(START, after(142_000), 'en-US')).toBe('2m 22s')
    expect(turnDuration(START, after(142_000), 'vi-VN')).toBe('2 phút 22 giây')
  })

  it('leaves out zero parts and rounds a quick turn up to a second', () => {
    expect(turnDuration(START, after(120_000), 'en-US')).toBe('2m')
    expect(turnDuration(START, after(3_660_000), 'en-US')).toBe('1h 1m')
    expect(turnDuration(START, after(200), 'en-US')).toBe('1s')
  })

  it('shows nothing without an end, or with one before the start', () => {
    expect(turnDuration(START, null, 'en-US')).toBeNull()
    expect(turnDuration(START, after(-5_000), 'en-US')).toBeNull()
  })
})

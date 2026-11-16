import { describe, expect, it } from 'vitest'
import { formatDuration } from './duration'

const units = {
  seconds: (value: string) => `${value}s`,
  minutes: (minutes: string, seconds: string) => `${minutes}m ${seconds}s`,
  hours: (hours: string, minutes: string) => `${hours}h ${minutes}m`,
}

describe('formatDuration', () => {
  it('keeps one decimal under a minute', () => {
    expect(formatDuration(12_209, 'en-US', units)).toBe('12.2s')
  })

  it('shows minutes and padded seconds', () => {
    expect(formatDuration(185_000, 'en-US', units)).toBe('3m 05s')
  })

  it('shows hours and padded minutes', () => {
    expect(formatDuration(7_800_000, 'en-US', units)).toBe('2h 10m')
  })
})

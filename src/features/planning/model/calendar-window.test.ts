import { describe, expect, it } from 'vitest'
import { planningCalendarWindows, visibleCalendarRange } from './calendar-window'

const days = (window: { from: string; to: string }) =>
  Math.round((new Date(window.to).getTime() + 1 - new Date(window.from).getTime()) / 86_400_000)

describe('calendar windows', () => {
  it('starts the visible range on Monday', () => {
    const { start, end } = visibleCalendarRange('2026-10-31', 'week')
    expect(start.getDay()).toBe(1)
    expect(Math.round((end.getTime() - start.getTime()) / 86_400_000)).toBe(7)
  })

  it('covers the visible weeks with two weeks either side in four-week blocks', () => {
    const windows = planningCalendarWindows('2026-10-31', 'month')
    const { start, end } = visibleCalendarRange('2026-10-31', 'month')
    expect(windows.every((window) => days(window) === 28)).toBe(true)
    expect(new Date(windows[0]!.from).getTime()).toBeLessThanOrEqual(
      start.getTime() - 14 * 86_400_000,
    )
    expect(new Date(windows.at(-1)!.to).getTime()).toBeGreaterThanOrEqual(
      end.getTime() + 14 * 86_400_000 - 1,
    )
  })

  it('reuses the same blocks when moving to the next week', () => {
    const current = planningCalendarWindows('2026-10-28', 'week').map((window) => window.from)
    const next = planningCalendarWindows('2026-11-04', 'week').map((window) => window.from)
    expect(next.filter((from) => current.includes(from)).length).toBeGreaterThan(0)
  })
})

import type { PlanningCalendarView } from '../config/planning.filters'

/** One calendar fetch: posts whose calendar time falls in [from, to]. */
export type PlanningCalendarWindow = { from: string; to: string }

const CHUNK_DAYS = 28
const PADDING_DAYS = 14
/** A Monday: chunks are aligned to it so the same weeks always map to the same requests. */
const EPOCH = new Date(2024, 0, 1)

function fromDateKey(dateKey: string): Date {
  const [year = 0, month = 1, day = 1] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return addDays(start, -((start.getDay() + 6) % 7))
}

/** Whole local days between two dates; rounding absorbs daylight-saving shifts. */
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

/** Weeks the calendar shows for a date (end exclusive), starting on Monday. */
export function visibleCalendarRange(
  dateKey: string,
  view: PlanningCalendarView,
): { start: Date; end: Date } {
  const date = fromDateKey(dateKey)
  if (view === 'week') {
    const start = startOfWeek(date)
    return { start, end: addDays(start, 7) }
  }
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return {
    start: startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1)),
    end: addDays(startOfWeek(lastDay), 7),
  }
}

/**
 * Four-week windows covering the visible weeks plus two weeks either side. Windows are fixed
 * blocks, so moving to the next week or month reuses the ones already loaded and only fetches
 * what is new, instead of loading every post at once.
 */
export function planningCalendarWindows(
  dateKey: string,
  view: PlanningCalendarView,
): PlanningCalendarWindow[] {
  const { start, end } = visibleCalendarRange(dateKey, view)
  const first = Math.floor(daysBetween(EPOCH, addDays(start, -PADDING_DAYS)) / CHUNK_DAYS)
  const paddedEnd = addDays(end, PADDING_DAYS)
  const windows: PlanningCalendarWindow[] = []
  for (let index = first; addDays(EPOCH, index * CHUNK_DAYS) < paddedEnd; index += 1) {
    const from = addDays(EPOCH, index * CHUNK_DAYS)
    const to = new Date(addDays(from, CHUNK_DAYS).getTime() - 1)
    windows.push({ from: from.toISOString(), to: to.toISOString() })
  }
  return windows
}

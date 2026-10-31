import { describe, expect, it } from 'vitest'
import type { PlanningContent } from '../api'
import { groupPlanningCalendarContents } from './calendar-event-date'

const post = (id: string, localTime: string) =>
  ({
    id,
    scheduledAt: new Date(localTime).toISOString(),
    createdAt: new Date(localTime).toISOString(),
    publications: [],
  }) as unknown as PlanningContent

const ids = (groups: PlanningContent[][]) => groups.map((group) => group.map(({ id }) => id))

describe('calendar stacks', () => {
  const posts = [
    post('evening', '2026-10-30T20:22:00'),
    post('afternoon', '2026-10-30T15:35:00'),
    post('same-hour', '2026-10-30T16:10:00'),
    post('next-day', '2026-10-31T09:00:00'),
  ]

  it('stacks every post of a day in month view, in time order', () => {
    expect(ids(groupPlanningCalendarContents(posts, 'month'))).toEqual([
      ['afternoon', 'same-hour', 'evening'],
      ['next-day'],
    ])
  })

  it('stacks only posts within an hour of the first one in week view', () => {
    expect(ids(groupPlanningCalendarContents(posts, 'week'))).toEqual([
      ['afternoon', 'same-hour'],
      ['evening'],
      ['next-day'],
    ])
  })

  it('does not stack across midnight', () => {
    const late = [post('late', '2026-10-30T23:40:00'), post('early', '2026-10-31T00:10:00')]
    expect(ids(groupPlanningCalendarContents(late, 'week'))).toEqual([['late'], ['early']])
  })
})

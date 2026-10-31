import type { PlanningContent } from '../api'
import type { PlanningCalendarView } from '../config/planning.filters'

const HOUR_MS = 60 * 60 * 1000

export function planningCalendarEventDate(content: PlanningContent): string {
  const firstPublishedAt = content.publications
    ?.filter((publication) => !['cancelled', 'deleted'].includes(publication.status))
    .map((publication) => publication.publishedAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0]

  return firstPublishedAt ?? content.scheduledAt ?? content.createdAt
}

/**
 * Groups posts that would crowd one calendar spot into a stack, in time order.
 * Month view stacks a whole day; week view stacks posts within an hour of the first
 * one, since a week event takes one hour of height.
 */
export function groupPlanningCalendarContents(
  contents: PlanningContent[],
  view: PlanningCalendarView,
): PlanningContent[][] {
  const sorted = contents
    .map((content) => ({ content, start: new Date(planningCalendarEventDate(content)) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const groups: { start: Date; contents: PlanningContent[] }[] = []
  for (const item of sorted) {
    const current = groups.at(-1)
    const joins =
      current &&
      isSameLocalDay(current.start, item.start) &&
      (view === 'month' || item.start.getTime() - current.start.getTime() < HOUR_MS)
    if (joins) current.contents.push(item.content)
    else groups.push({ start: item.start, contents: [item.content] })
  }
  return groups.map((group) => group.contents)
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

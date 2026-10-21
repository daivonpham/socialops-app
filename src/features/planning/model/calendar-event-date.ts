import type { PlanningContent } from '../api'

export function planningCalendarEventDate(content: PlanningContent): string {
  const firstPublishedAt = content.publications
    ?.filter((publication) => !['cancelled', 'deleted'].includes(publication.status))
    .map((publication) => publication.publishedAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0]

  return firstPublishedAt ?? content.scheduledAt ?? content.createdAt
}

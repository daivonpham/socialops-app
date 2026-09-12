import type { PlanningPlatform, PlanningPostType } from '../api'

export function getPlanningPath(platform: PlanningPlatform): string {
  return `/platforms/${platform}/planning`
}

export function getPlanningCreatePath(
  platform: PlanningPlatform,
  options?: { date?: string; postType?: PlanningPostType },
): string {
  const path = `${getPlanningPath(platform)}/create`
  const searchParams = new URLSearchParams()
  if (options?.date) searchParams.set('date', options.date)
  if (options?.postType) searchParams.set('postType', options.postType)
  const search = searchParams.toString()
  return search ? `${path}?${search}` : path
}

export function getPlanningEditPath(platform: PlanningPlatform, contentId: string): string {
  return `${getPlanningPath(platform)}/${contentId}/edit`
}

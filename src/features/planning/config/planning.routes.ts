import type { PlanningPlatform } from '../api'

export function getPlanningPath(platform: PlanningPlatform): string {
  return `/platforms/${platform}/planning`
}

export function getPlanningCreatePath(platform: PlanningPlatform): string {
  return `${getPlanningPath(platform)}/create`
}

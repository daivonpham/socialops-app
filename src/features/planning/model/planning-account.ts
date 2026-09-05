import type { PlanningPlatform, PlanningTarget } from '../api'

export type PlanningAccount = PlanningTarget & {
  platform: PlanningPlatform
}

import type { FacebookSyncStatusDto } from '../api'

type SyncPage = FacebookSyncStatusDto['pages'][number]

export type RefreshAvailability =
  | { state: 'ready' }
  | { state: 'syncing' }
  | { state: 'rate_limited' }
  | { state: 'wait'; minutes: number }

/** Whether a Page can be refreshed by hand now; the API enforces the same rules. */
export function refreshAvailability(page: SyncPage, now: number): RefreshAvailability {
  if (page.status === 'syncing' || !page.backfillCompleted) return { state: 'syncing' }
  const availableAt = page.refreshAvailableAt ? Date.parse(page.refreshAvailableAt) : 0
  if (availableAt <= now) return { state: 'ready' }
  if (page.status === 'rate_limited') return { state: 'rate_limited' }
  return { state: 'wait', minutes: Math.ceil((availableAt - now) / 60_000) }
}

/** Refreshing every Page works once any of them can be; otherwise the soonest wait applies. */
export function refreshAllAvailability(pages: SyncPage[], now: number): RefreshAvailability {
  const states = pages.map((page) => refreshAvailability(page, now))
  if (!states.length || states.some((item) => item.state === 'ready')) return { state: 'ready' }
  if (states.some((item) => item.state === 'syncing')) return { state: 'syncing' }
  const waits = states.flatMap((item) => (item.state === 'wait' ? [item.minutes] : []))
  return waits.length ? { state: 'wait', minutes: Math.min(...waits) } : { state: 'rate_limited' }
}

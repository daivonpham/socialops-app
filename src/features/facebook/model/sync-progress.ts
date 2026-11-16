import type { FacebookSyncStatusDto } from '../api'

type SyncPage = FacebookSyncStatusDto['pages'][number]

/**
 * Where the Brand's Pages are in their full sync. A Page is syncing until its year of history
 * has been fetched. `firstSync` is when none of the Pages has any data yet, e.g. right after
 * connecting Facebook: the screen would only show zeros, so it shows the progress instead.
 */
export function syncProgress(pages: SyncPage[]): {
  syncing: SyncPage[]
  done: number
  firstSync: boolean
} {
  const syncing = pages.filter((page) => !page.backfillCompleted)
  return {
    syncing,
    done: pages.length - syncing.length,
    firstSync:
      syncing.length > 0 &&
      syncing.length === pages.length &&
      pages.every((page) => !page.lastSyncedAt),
  }
}

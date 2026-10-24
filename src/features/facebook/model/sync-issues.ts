import type { FacebookSyncStatusDto } from '../api'

type SyncPage = FacebookSyncStatusDto['pages'][number]

/** Failed runs in a row before a Page is reported (15 + 30 + 60 min of automatic retries). */
const PERSISTENT_FAILURES = 3
/** A Page that has not synced successfully for this long is reported regardless of count. */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000

/**
 * Pages whose sync keeps failing. A single failed run is not reported: the sync worker
 * retries on its own and usually recovers. Token/permission failures are excluded upstream
 * because those Pages leave the CONNECTED state and get a reconnect prompt instead.
 */
export function persistentSyncIssues(pages: SyncPage[], now = Date.now()): SyncPage[] {
  return pages.filter((page) => {
    if (!page.backfillCompleted) return false
    if (page.status !== 'error' && page.status !== 'rate_limited') return false
    const stale = !page.lastSyncedAt || now - Date.parse(page.lastSyncedAt) > STALE_AFTER_MS
    return page.failureCount >= PERSISTENT_FAILURES || stale
  })
}

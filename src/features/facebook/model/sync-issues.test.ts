import { describe, expect, it } from 'vitest'
import type { FacebookSyncStatusDto } from '../api'
import { persistentSyncIssues } from './sync-issues'

type Page = FacebookSyncStatusDto['pages'][number]
const NOW = Date.parse('2026-10-24T12:00:00Z')
const hoursAgo = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString()

const page = (overrides: Partial<Page>): Page => ({
  pageId: 'p1',
  name: 'Page',
  status: 'error',
  failureCount: 1,
  lastSyncedAt: hoursAgo(1),
  refreshAvailableAt: null,
  historyStartAt: null,
  backfillCompleted: true,
  lastErrorCode: 'FACEBOOK_SYNC_FAILED',
  ...overrides,
})

describe('persistentSyncIssues', () => {
  it('ignores a single recent failure the worker will retry', () => {
    expect(persistentSyncIssues([page({ failureCount: 1 })], NOW)).toEqual([])
    expect(persistentSyncIssues([page({ status: 'rate_limited', failureCount: 2 })], NOW)).toEqual(
      [],
    )
  })

  it('reports Pages after repeated failures or a day without a successful sync', () => {
    const repeated = page({ pageId: 'repeated', failureCount: 3 })
    const stale = page({ pageId: 'stale', failureCount: 1, lastSyncedAt: hoursAgo(25) })
    expect(persistentSyncIssues([repeated, stale], NOW).map((item) => item.pageId)).toEqual([
      'repeated',
      'stale',
    ])
  })

  it('never reports healthy Pages or Pages still loading their history', () => {
    expect(
      persistentSyncIssues(
        [
          page({ status: 'idle', failureCount: 0, lastSyncedAt: hoursAgo(48) }),
          page({ backfillCompleted: false, failureCount: 9 }),
        ],
        NOW,
      ),
    ).toEqual([])
  })
})

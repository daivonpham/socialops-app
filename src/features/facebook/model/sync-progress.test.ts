import { describe, expect, it } from 'vitest'
import { syncProgress } from './sync-progress'

const page = (overrides: Partial<Parameters<typeof syncProgress>[0][number]> = {}) => ({
  pageId: 'p1',
  name: 'Page',
  status: 'idle' as const,
  failureCount: 0,
  lastSyncedAt: '2026-11-15T00:00:00.000Z',
  historyStartAt: '2025-11-15T00:00:00.000Z',
  backfillCompleted: true,
  lastErrorCode: null,
  refreshAvailableAt: null,
  ...overrides,
})

describe('syncProgress', () => {
  it('is a first sync while no Page has any data yet', () => {
    const pages = [
      page({ pageId: 'a', backfillCompleted: false, lastSyncedAt: null, status: 'syncing' }),
      page({ pageId: 'b', backfillCompleted: false, lastSyncedAt: null, status: 'pending' }),
    ]
    expect(syncProgress(pages)).toMatchObject({ firstSync: true, done: 0 })
  })

  it('is not a first sync once a Page has data, even while it syncs again', () => {
    const progress = syncProgress([
      page({ pageId: 'a', backfillCompleted: false }),
      page({ pageId: 'b', backfillCompleted: false, lastSyncedAt: null }),
    ])
    expect(progress.firstSync).toBe(false)
    expect(progress.syncing).toHaveLength(2)
  })

  it('counts the Pages that are done', () => {
    const progress = syncProgress([
      page({ pageId: 'a' }),
      page({ pageId: 'b', backfillCompleted: false, lastSyncedAt: null }),
    ])
    expect(progress).toMatchObject({ firstSync: false, done: 1 })
  })
})

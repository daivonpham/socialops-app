import { describe, expect, it } from 'vitest'
import type { FacebookSyncStatusDto } from '../api'
import { refreshAllAvailability, refreshAvailability } from './sync-refresh'

const NOW = Date.parse('2026-11-03T12:00:00Z')
const page = (values: Partial<FacebookSyncStatusDto['pages'][number]>) => ({
  pageId: '1',
  name: 'Page',
  status: 'idle' as const,
  failureCount: 0,
  lastSyncedAt: null,
  historyStartAt: null,
  backfillCompleted: true,
  lastErrorCode: null,
  refreshAvailableAt: null,
  ...values,
})

describe('refreshAvailability', () => {
  it('is ready without a wait and once the wait has passed', () => {
    expect(refreshAvailability(page({}), NOW)).toEqual({ state: 'ready' })
    expect(refreshAvailability(page({ refreshAvailableAt: '2026-11-03T11:59:00Z' }), NOW)).toEqual({
      state: 'ready',
    })
  })

  it('counts the minutes left, rounding up', () => {
    expect(refreshAvailability(page({ refreshAvailableAt: '2026-11-03T12:17:10Z' }), NOW)).toEqual({
      state: 'wait',
      minutes: 18,
    })
  })

  it('tells syncing and rate limiting apart from a plain wait', () => {
    expect(refreshAvailability(page({ status: 'syncing' }), NOW)).toEqual({ state: 'syncing' })
    expect(refreshAvailability(page({ backfillCompleted: false }), NOW)).toEqual({
      state: 'syncing',
    })
    expect(
      refreshAvailability(
        page({ status: 'rate_limited', refreshAvailableAt: '2026-11-03T14:00:00Z' }),
        NOW,
      ),
    ).toEqual({ state: 'rate_limited' })
  })
})

describe('refreshAllAvailability', () => {
  const soon = page({ refreshAvailableAt: '2026-11-03T12:05:00Z' })
  const later = page({ refreshAvailableAt: '2026-11-03T12:20:00Z' })
  const limited = page({ status: 'rate_limited', refreshAvailableAt: '2026-11-03T14:00:00Z' })

  it('is ready as soon as one Page can be refreshed', () => {
    expect(refreshAllAvailability([later, page({})], NOW)).toEqual({ state: 'ready' })
  })

  it('reports the soonest wait, or why nothing can be refreshed', () => {
    expect(refreshAllAvailability([later, soon, limited], NOW)).toEqual({
      state: 'wait',
      minutes: 5,
    })
    expect(refreshAllAvailability([later, page({ status: 'syncing' })], NOW)).toEqual({
      state: 'syncing',
    })
    expect(refreshAllAvailability([limited], NOW)).toEqual({ state: 'rate_limited' })
  })
})

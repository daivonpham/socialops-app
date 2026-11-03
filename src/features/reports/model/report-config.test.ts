import { describe, expect, it } from 'vitest'
import { reportConfigFromSearch } from './report-config'

describe('reportConfigFromSearch', () => {
  it('starts a report on the Page and period it was opened from', () => {
    const config = reportConfigFromSearch(
      new URLSearchParams(
        'template=page_performance&since=2026-10-06&until=2026-11-02&pageId=123&compare=none',
      ),
    )
    expect(config).toMatchObject({
      template: 'page_performance',
      period: { preset: 'custom', since: '2026-10-06', until: '2026-11-02' },
      pageIds: ['123'],
      compare: false,
    })
  })

  it('ignores anything invalid and keeps the defaults', () => {
    const config = reportConfigFromSearch(
      new URLSearchParams('template=nope&since=2026-11-02&until=2026-10-06&pageId=all'),
    )
    expect(config).toMatchObject({
      template: 'period_overview',
      period: { preset: '30d' },
      pageIds: 'all',
      compare: true,
    })
  })
})

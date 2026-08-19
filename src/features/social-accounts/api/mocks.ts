import { http, HttpResponse } from 'msw'
import { envelope } from '@/mocks/envelope'
import type { SocialAccountCounts } from './types'

/** Counts differ per brand so switching brand visibly changes the sidebar. */
const MOCK_COUNTS: Record<string, SocialAccountCounts> = {
  'br-aurora': { facebook: 3, tiktok: 5 },
  'br-nimbus': { facebook: 1, tiktok: 8 },
  'br-solstice': { facebook: 6, tiktok: 0 },
}

export const socialAccountHandlers = [
  http.get('/api/brands/:brandId/social-accounts/counts', ({ params }) => {
    const counts = MOCK_COUNTS[String(params.brandId)]
    if (!counts) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(
      envelope(counts, `/brands/${String(params.brandId)}/social-accounts/counts`),
    )
  }),
]

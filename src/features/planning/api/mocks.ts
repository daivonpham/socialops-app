import { http, HttpResponse } from 'msw'
import { envelope } from '@/mocks/envelope'
import type {
  CreatePlanningContentInput,
  PlanningContent,
  PlanningContentsResponse,
  PlanningPlatform,
  PlanningStatus,
  PlanningTarget,
} from './types'

const TARGETS: Record<string, PlanningTarget> = {
  'fb-main': { id: 'fb-main', name: 'Aurora Coffee' },
  'fb-roastery': { id: 'fb-roastery', name: 'Aurora Roastery' },
  'fb-hanoi': { id: 'fb-hanoi', name: 'Aurora Coffee Hanoi' },
  'fb-danang': { id: 'fb-danang', name: 'Aurora Coffee Da Nang' },
  'fb-saigon': { id: 'fb-saigon', name: 'Aurora Coffee Saigon' },
  'tt-main': { id: 'tt-main', name: 'Aurora Coffee TikTok' },
  'tt-barista': { id: 'tt-barista', name: 'Aurora Barista Lab' },
}

const target = (id: string) => TARGETS[id] ?? { id, name: id }

export const MOCK_PLANNING_CONTENTS: PlanningContent[] = [
  {
    id: 'content-001',
    caption: 'September blend launch across all our local pages.',
    title: 'September blend launch',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    mediaType: 'image',
    platform: 'facebook',
    targets: ['fb-main', 'fb-roastery', 'fb-hanoi', 'fb-danang', 'fb-saigon'].map(target),
    status: 'scheduled',
    scheduledAt: '2026-09-08T09:00:00+07:00',
    createdAt: '2026-08-28T10:00:00+07:00',
    createdBy: 'Linh Nguyen',
  },
  {
    id: 'content-002',
    caption: 'Three ways to make cold brew at home.',
    mediaType: 'video',
    platform: 'tiktok',
    targets: [target('tt-main')],
    status: 'approved',
    scheduledAt: '2026-09-08T11:30:00+07:00',
    createdAt: '2026-09-01T08:00:00+07:00',
    createdBy: 'Minh Tran',
  },
  {
    id: 'content-003',
    caption: 'Meet the growers behind this month’s beans.',
    mediaType: 'image',
    platform: 'facebook',
    targets: [target('fb-main')],
    status: 'pending_approval',
    scheduledAt: '2026-09-08T14:00:00+07:00',
    createdAt: '2026-09-02T12:00:00+07:00',
    createdBy: 'An Pham',
  },
  {
    id: 'content-004',
    caption: 'Barista speed challenge.',
    mediaType: 'video',
    platform: 'tiktok',
    targets: [target('tt-barista')],
    status: 'draft',
    scheduledAt: '2026-09-08T17:00:00+07:00',
    createdAt: '2026-09-03T09:15:00+07:00',
    createdBy: 'Minh Tran',
  },
  {
    id: 'content-005',
    caption: 'Store hours for the holiday weekend.',
    mediaType: 'text',
    platform: 'facebook',
    targets: [target('fb-hanoi')],
    status: 'published',
    scheduledAt: '2026-09-01T08:00:00+07:00',
    createdAt: '2026-08-25T08:00:00+07:00',
    createdBy: 'Linh Nguyen',
  },
  {
    id: 'content-006',
    caption: 'Latte art in 20 seconds.',
    mediaType: 'video',
    platform: 'tiktok',
    targets: [target('tt-main')],
    status: 'publishing',
    scheduledAt: '2026-09-10T10:00:00+07:00',
    createdAt: '2026-09-04T11:00:00+07:00',
    createdBy: 'An Pham',
  },
  {
    id: 'content-007',
    caption: 'Behind the scenes at our roastery.',
    mediaType: 'video',
    platform: 'facebook',
    targets: [target('fb-roastery')],
    status: 'failed',
    scheduledAt: '2026-09-12T15:00:00+07:00',
    createdAt: '2026-09-05T10:00:00+07:00',
    createdBy: 'Linh Nguyen',
  },
  {
    id: 'content-008',
    caption: 'First draft of the autumn menu teaser.',
    mediaType: 'image',
    platform: 'facebook',
    targets: [target('fb-main')],
    status: 'rejected',
    scheduledAt: '2026-09-15T09:00:00+07:00',
    createdAt: '2026-09-06T13:00:00+07:00',
    createdBy: 'Minh Tran',
  },
  {
    id: 'content-009',
    caption: 'Coffee tasting vocabulary, part one.',
    mediaType: 'video',
    platform: 'tiktok',
    targets: [target('tt-barista')],
    status: 'scheduled',
    scheduledAt: '2026-09-18T19:00:00+07:00',
    createdAt: '2026-09-07T08:00:00+07:00',
    createdBy: 'An Pham',
  },
  {
    id: 'content-010',
    caption: 'Weekend pour-over workshop registration.',
    mediaType: 'image',
    platform: 'facebook',
    targets: [target('fb-danang'), target('fb-saigon')],
    status: 'approved',
    scheduledAt: '2026-09-22T12:00:00+07:00',
    createdAt: '2026-09-09T09:00:00+07:00',
    createdBy: 'Linh Nguyen',
  },
  {
    id: 'content-011',
    caption: 'POV: your first coffee of the day.',
    mediaType: 'video',
    platform: 'tiktok',
    targets: [target('tt-main')],
    status: 'published',
    scheduledAt: '2026-09-25T07:30:00+07:00',
    createdAt: '2026-09-10T10:00:00+07:00',
    createdBy: 'Minh Tran',
  },
  {
    id: 'content-012',
    caption: 'October campaign concept.',
    mediaType: 'text',
    platform: 'facebook',
    targets: [target('fb-main')],
    status: 'draft',
    createdAt: '2026-09-28T16:00:00+07:00',
    createdBy: 'An Pham',
  },
]

let contents = [...MOCK_PLANNING_CONTENTS]
let createdCount = 0

function dateInRange(content: PlanningContent, from: string | null, to: string | null) {
  const value = new Date(content.scheduledAt ?? content.createdAt).getTime()
  const fromValue = from ? new Date(from).getTime() : Number.NEGATIVE_INFINITY
  const toValue = to
    ? new Date(to.length === 10 ? `${to}T23:59:59.999Z` : to).getTime()
    : Number.POSITIVE_INFINITY
  return value >= fromValue && value <= toValue
}

export const planningHandlers = [
  http.get('/api/brands/:brandId/planning', ({ params, request }) => {
    const search = new URL(request.url).searchParams
    const platform = (search.get('platform') ?? 'all') as 'all' | PlanningPlatform
    const accountId = search.get('accountId') ?? 'all'
    const status = (search.get('status') ?? 'all') as 'all' | PlanningStatus
    const brandId = String(params.brandId)
    const brandContents =
      brandId === 'br-solstice'
        ? []
        : brandId === 'br-nimbus'
          ? contents.filter((content) => content.platform === 'tiktok')
          : contents
    const data: PlanningContentsResponse = {
      items: brandContents.filter(
        (content) =>
          (platform === 'all' || content.platform === platform) &&
          (accountId === 'all' || content.targets.some((item) => item.id === accountId)) &&
          (status === 'all' || content.status === status) &&
          dateInRange(content, search.get('from'), search.get('to')),
      ),
    }
    return HttpResponse.json(envelope(data, `/brands/${String(params.brandId)}/planning`))
  }),

  http.post('/api/brands/:brandId/planning', async ({ params, request }) => {
    const body = (await request.json()) as Omit<CreatePlanningContentInput, 'brandId'>
    createdCount += 1
    const status: PlanningStatus =
      body.intent === 'draft'
        ? 'draft'
        : body.intent === 'approval'
          ? 'pending_approval'
          : body.intent === 'schedule'
            ? 'scheduled'
            : 'publishing'
    const targets = body.publications.map((publication) => target(publication.socialAccountId))
    const content: PlanningContent = {
      id: `content-created-${createdCount}`,
      caption: body.caption,
      thumbnailUrl: body.media[0]?.url,
      mediaType: body.media[0]?.type ?? 'text',
      platform: body.platform,
      targets,
      publications: body.publications.map((publication, index) => ({
        id: `publication-created-${createdCount}-${index + 1}`,
        socialAccountId: publication.socialAccountId,
        target: targets[index]!,
        captionOverride: publication.captionOverride,
        scheduledAt: publication.scheduledAt,
        status,
      })),
      status,
      scheduledAt: body.publications[0]?.scheduledAt,
      createdAt: '2026-09-08T08:00:00+07:00',
      createdBy: 'Current User',
    }
    contents = [...contents, content]
    return HttpResponse.json(envelope(content, `/brands/${String(params.brandId)}/planning`), {
      status: 201,
    })
  }),

  http.patch('/api/brands/:brandId/planning/:contentId/reschedule', async ({ params, request }) => {
    const body = (await request.json()) as { scheduledAt: string }
    const content = contents.find((item) => item.id === params.contentId)
    if (!content) return new HttpResponse(null, { status: 404 })
    const updated: PlanningContent = {
      ...content,
      scheduledAt: body.scheduledAt,
      status: 'scheduled',
    }
    contents = contents.map((item) => (item.id === updated.id ? updated : item))
    return HttpResponse.json(
      envelope(
        updated,
        `/brands/${String(params.brandId)}/planning/${String(params.contentId)}/reschedule`,
      ),
    )
  }),
]

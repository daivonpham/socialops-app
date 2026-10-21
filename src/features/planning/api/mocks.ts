import { planningStatusGroup } from '../model/planning-status-group'
import { http, HttpResponse } from 'msw'
import { envelope } from '@/mocks/envelope'
import type {
  CreatePlanningContentInput,
  PlanningContent,
  PlanningApprovalStatus,
  PlanningContentsResponse,
  PlanningPlatform,
  PlanningPostType,
  PlanningStatus,
  PlanningTarget,
  UpdatePlanningContentInput,
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
    version: 1,
    caption: 'September blend launch across all our local pages.',
    title: 'September blend launch',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    mediaType: 'image',
    type: 'facebook_feed',
    platform: 'facebook',
    targets: ['fb-main', 'fb-roastery', 'fb-hanoi', 'fb-danang', 'fb-saigon'].map(target),
    status: 'scheduled',
    approvalStatus: 'none',
    scheduledAt: '2026-09-08T09:00:00+07:00',
    createdAt: '2026-08-28T10:00:00+07:00',
    createdBy: 'Linh Nguyen',
  },
  {
    id: 'content-002',
    version: 1,
    caption: 'Three ways to make cold brew at home.',
    mediaType: 'video',
    type: 'tiktok_video',
    platform: 'tiktok',
    targets: [target('tt-main')],
    status: 'scheduled',
    approvalStatus: 'approved',
    scheduledAt: '2026-09-08T11:30:00+07:00',
    createdAt: '2026-09-01T08:00:00+07:00',
    createdBy: 'Minh Tran',
  },
  {
    id: 'content-003',
    version: 1,
    caption: 'Meet the growers behind this month’s beans.',
    mediaType: 'image',
    type: 'facebook_story',
    platform: 'facebook',
    targets: [target('fb-main')],
    status: 'draft',
    approvalStatus: 'pending',
    scheduledAt: '2026-09-08T14:00:00+07:00',
    createdAt: '2026-09-02T12:00:00+07:00',
    createdBy: 'An Pham',
  },
  {
    id: 'content-004',
    version: 1,
    caption: 'Barista speed challenge.',
    mediaType: 'video',
    type: 'tiktok_video',
    platform: 'tiktok',
    targets: [target('tt-barista')],
    status: 'draft',
    approvalStatus: 'none',
    scheduledAt: '2026-09-08T17:00:00+07:00',
    createdAt: '2026-09-03T09:15:00+07:00',
    createdBy: 'Minh Tran',
  },
  {
    id: 'content-005',
    version: 1,
    caption: 'Store hours for the holiday weekend.',
    mediaType: 'text',
    type: 'facebook_feed',
    platform: 'facebook',
    targets: [target('fb-hanoi')],
    status: 'published',
    approvalStatus: 'none',
    scheduledAt: '2026-09-01T08:00:00+07:00',
    createdAt: '2026-08-25T08:00:00+07:00',
    createdBy: 'Linh Nguyen',
  },
  {
    id: 'content-006',
    version: 1,
    caption: 'Latte art in 20 seconds.',
    mediaType: 'video',
    type: 'tiktok_video',
    platform: 'tiktok',
    targets: [target('tt-main')],
    status: 'publishing',
    approvalStatus: 'approved',
    scheduledAt: '2026-09-10T10:00:00+07:00',
    createdAt: '2026-09-04T11:00:00+07:00',
    createdBy: 'An Pham',
  },
  {
    id: 'content-007',
    version: 1,
    caption: 'Behind the scenes at our roastery.',
    mediaType: 'video',
    type: 'facebook_reel',
    platform: 'facebook',
    targets: [target('fb-roastery')],
    status: 'failed',
    approvalStatus: 'approved',
    scheduledAt: '2026-09-12T15:00:00+07:00',
    createdAt: '2026-09-05T10:00:00+07:00',
    createdBy: 'Linh Nguyen',
  },
  {
    id: 'content-008',
    version: 1,
    caption: 'First draft of the autumn menu teaser.',
    mediaType: 'image',
    type: 'facebook_feed',
    platform: 'facebook',
    targets: [target('fb-main')],
    status: 'draft',
    approvalStatus: 'rejected',
    scheduledAt: '2026-09-15T09:00:00+07:00',
    createdAt: '2026-09-06T13:00:00+07:00',
    createdBy: 'Minh Tran',
  },
  {
    id: 'content-009',
    version: 1,
    caption: 'Coffee tasting vocabulary, part one.',
    mediaType: 'video',
    type: 'tiktok_video',
    platform: 'tiktok',
    targets: [target('tt-barista')],
    status: 'scheduled',
    approvalStatus: 'none',
    scheduledAt: '2026-09-18T19:00:00+07:00',
    createdAt: '2026-09-07T08:00:00+07:00',
    createdBy: 'An Pham',
  },
  {
    id: 'content-010',
    version: 1,
    caption: 'Weekend pour-over workshop registration.',
    mediaType: 'image',
    type: 'facebook_feed',
    platform: 'facebook',
    targets: [target('fb-danang'), target('fb-saigon')],
    status: 'scheduled',
    approvalStatus: 'approved',
    scheduledAt: '2026-09-22T12:00:00+07:00',
    createdAt: '2026-09-09T09:00:00+07:00',
    createdBy: 'Linh Nguyen',
  },
  {
    id: 'content-011',
    version: 1,
    caption: 'POV: your first coffee of the day.',
    mediaType: 'video',
    type: 'tiktok_video',
    platform: 'tiktok',
    targets: [target('tt-main')],
    status: 'published',
    approvalStatus: 'approved',
    scheduledAt: '2026-09-25T07:30:00+07:00',
    createdAt: '2026-09-10T10:00:00+07:00',
    createdBy: 'Minh Tran',
  },
  {
    id: 'content-012',
    version: 1,
    caption: 'October campaign concept.',
    mediaType: 'text',
    type: 'facebook_feed',
    platform: 'facebook',
    targets: [target('fb-main')],
    status: 'draft',
    approvalStatus: 'none',
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
  http.get('/api/brands/:brandId/planning/accounts', ({ params }) => {
    const brandId = String(params.brandId)
    const items = Object.values(TARGETS)
      .filter((item) => (brandId === 'br-nimbus' ? item.id.startsWith('tt-') : true))
      .map((item) => ({
        ...item,
        platform: item.id.startsWith('tt-') ? ('tiktok' as const) : ('facebook' as const),
      }))
    return HttpResponse.json(envelope({ items }, `/brands/${brandId}/planning/accounts`))
  }),
  http.get('/api/brands/:brandId/planning', ({ params, request }) => {
    const search = new URL(request.url).searchParams
    const platform = (search.get('platform') ?? 'all') as 'all' | PlanningPlatform
    const type = (search.get('type') ?? 'all') as 'all' | PlanningPostType
    const accountId = search.get('accountId') ?? 'all'
    const statusGroup = search.get('statusGroup') ?? 'all'
    const attention = search.get('attention') ?? 'all'
    const approvalStatus = (search.get('approvalStatus') ?? 'all') as 'all' | PlanningApprovalStatus
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
          (type === 'all' || content.type === type) &&
          (accountId === 'all' || content.targets.some((item) => item.id === accountId)) &&
          !['cancelled', 'deleted'].includes(content.status) &&
          (statusGroup === 'all' || planningStatusGroup(content) === statusGroup) &&
          (attention === 'all' ||
            content.publications?.some((item) =>
              ['failed', 'unknown', 'edit_unknown', 'delete_unknown'].includes(item.status),
            ) ||
            ['failed', 'unknown', 'edit_unknown', 'delete_unknown'].includes(content.status)) &&
          (approvalStatus === 'all' || content.approvalStatus === approvalStatus) &&
          dateInRange(content, search.get('from'), search.get('to')),
      ),
    }
    return HttpResponse.json(envelope(data, `/brands/${String(params.brandId)}/planning`))
  }),

  http.get('/api/brands/:brandId/planning/:contentId', ({ params }) => {
    const content = contents.find((item) => item.id === params.contentId)
    if (!content) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(
      envelope(content, `/brands/${String(params.brandId)}/planning/${String(params.contentId)}`),
    )
  }),

  http.post('/api/brands/:brandId/planning', async ({ params, request }) => {
    const body = (await request.json()) as Omit<CreatePlanningContentInput, 'brandId'>
    createdCount += 1
    const status: PlanningStatus =
      body.intent === 'schedule'
        ? 'scheduled'
        : body.intent === 'publish_now'
          ? 'publishing'
          : 'draft'
    const approvalStatus: PlanningApprovalStatus = body.intent === 'approval' ? 'pending' : 'none'
    const targets = body.publications.map((publication) => target(publication.socialAccountId))
    const content: PlanningContent = {
      id: `content-created-${createdCount}`,
      version: 1,
      caption: body.caption,
      thumbnailUrl: body.media[0]?.url,
      mediaType: body.media[0]?.type ?? 'text',
      type: body.type,
      link: body.link,
      media: body.media,
      platformSettings: body.platformSettings,
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
      approvalStatus,
      scheduledAt: body.publications[0]?.scheduledAt,
      createdAt: '2026-09-08T08:00:00+07:00',
      createdBy: 'Current User',
    }
    contents = [...contents, content]
    return HttpResponse.json(envelope(content, `/brands/${String(params.brandId)}/planning`), {
      status: 201,
    })
  }),

  http.patch('/api/brands/:brandId/planning/:contentId', async ({ params, request }) => {
    const body = (await request.json()) as Omit<UpdatePlanningContentInput, 'brandId' | 'contentId'>
    const content = contents.find((item) => item.id === params.contentId)
    if (!content) return new HttpResponse(null, { status: 404 })

    const targets = body.publications.map((publication) => target(publication.socialAccountId))
    const status: PlanningStatus =
      body.intent === 'schedule'
        ? 'scheduled'
        : body.intent === 'publish_now'
          ? 'publishing'
          : 'draft'
    const approvalStatus: PlanningApprovalStatus = body.intent === 'approval' ? 'pending' : 'none'
    const updated: PlanningContent = {
      ...content,
      version: content.version + 1,
      caption: body.caption,
      thumbnailUrl: body.media[0]?.url,
      mediaType: body.media[0]?.type ?? 'text',
      type: body.type,
      link: body.link,
      media: body.media,
      platformSettings: body.platformSettings,
      targets,
      publications: body.publications.map((publication, index) => ({
        id: content.publications?.[index]?.id ?? `publication-${content.id}-${index + 1}`,
        socialAccountId: publication.socialAccountId,
        target: targets[index]!,
        captionOverride: publication.captionOverride,
        scheduledAt: publication.scheduledAt,
        status,
      })),
      status,
      approvalStatus,
      scheduledAt: body.publications[0]?.scheduledAt ?? content.scheduledAt,
    }
    contents = contents.map((item) => (item.id === updated.id ? updated : item))
    return HttpResponse.json(
      envelope(updated, `/brands/${String(params.brandId)}/planning/${String(params.contentId)}`),
    )
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

  http.patch('/api/brands/:brandId/planning/:contentId/approval', async ({ params, request }) => {
    const body = (await request.json()) as { approvalStatus: PlanningApprovalStatus }
    const content = contents.find((item) => item.id === params.contentId)
    if (!content) return new HttpResponse(null, { status: 404 })
    const updated: PlanningContent = { ...content, approvalStatus: body.approvalStatus }
    contents = contents.map((item) => (item.id === updated.id ? updated : item))
    return HttpResponse.json(
      envelope(
        updated,
        `/brands/${String(params.brandId)}/planning/${String(params.contentId)}/approval`,
      ),
    )
  }),
  http.delete('/api/brands/:brandId/planning/:contentId/all', ({ params }) => {
    const content = contents.find((item) => item.id === params.contentId)
    if (!content) return new HttpResponse(null, { status: 404 })
    const results = (content.publications ?? []).map((row) => ({
      publicationId: row.id,
      socialAccountId: row.socialAccountId,
      outcome: ['deleted', 'cancelled'].includes(row.status)
        ? ('skipped' as const)
        : ('deleted' as const),
    }))
    const updated: PlanningContent = {
      ...content,
      status: 'deleted',
      publications: content.publications?.map((row) => ({
        ...row,
        status: row.externalPostId ? ('deleted' as const) : ('cancelled' as const),
      })),
    }
    contents = contents.map((item) => (item.id === updated.id ? updated : item))
    return HttpResponse.json(
      envelope(
        { content: updated, results },
        `/brands/${String(params.brandId)}/planning/${updated.id}/all`,
      ),
    )
  }),
  http.delete('/api/brands/:brandId/planning/:contentId', ({ params }) => {
    const content = contents.find((item) => item.id === params.contentId)
    if (!content) return new HttpResponse(null, { status: 404 })
    const updated: PlanningContent = {
      ...content,
      status: 'cancelled',
      publications: content.publications?.map((item) => ({ ...item, status: 'cancelled' })),
    }
    contents = contents.map((item) => (item.id === updated.id ? updated : item))
    return HttpResponse.json(
      envelope(updated, `/brands/${String(params.brandId)}/planning/${updated.id}`),
    )
  }),
  http.post('/api/brands/:brandId/planning/publications/:publicationId/retry', ({ params }) => {
    const content = contents.find((item) =>
      item.publications?.some((row) => row.id === params.publicationId),
    )
    if (!content) return new HttpResponse(null, { status: 404 })
    const updated: PlanningContent = {
      ...content,
      status: 'publishing',
      publications: content.publications?.map((row) =>
        row.id === params.publicationId
          ? { ...row, status: 'queued', errorCode: undefined, errorMessage: undefined }
          : row,
      ),
    }
    contents = contents.map((item) => (item.id === updated.id ? updated : item))
    return HttpResponse.json(
      envelope(updated, `/brands/${String(params.brandId)}/planning/${updated.id}`),
    )
  }),
  http.post('/api/brands/:brandId/planning/:contentId/retry-failed', ({ params }) => {
    const content = contents.find((item) => item.id === params.contentId)
    if (!content) return new HttpResponse(null, { status: 404 })
    const results = (content.publications ?? []).map((row) => ({
      publicationId: row.id,
      socialAccountId: row.socialAccountId,
      outcome: ['failed', 'unknown'].includes(row.status)
        ? ('queued' as const)
        : ('skipped' as const),
      ...(!['failed', 'unknown'].includes(row.status)
        ? { reason: 'PUBLICATION_NOT_RETRYABLE' }
        : {}),
    }))
    const updated: PlanningContent = {
      ...content,
      status: results.some((item) => item.outcome === 'queued') ? 'publishing' : content.status,
      publications: content.publications?.map((row) =>
        ['failed', 'unknown'].includes(row.status)
          ? { ...row, status: 'queued', errorCode: undefined, errorMessage: undefined }
          : row,
      ),
    }
    contents = contents.map((item) => (item.id === updated.id ? updated : item))
    return HttpResponse.json(
      envelope(
        { content: updated, results },
        `/brands/${String(params.brandId)}/planning/${updated.id}/retry-failed`,
      ),
    )
  }),
  http.post(
    '/api/brands/:brandId/planning/publications/:publicationId/caption-edit',
    async ({ params, request }) => {
      const body = (await request.json()) as { caption: string }
      const content = contents.find((item) =>
        item.publications?.some((row) => row.id === params.publicationId),
      )
      if (!content) return new HttpResponse(null, { status: 404 })
      const updated: PlanningContent = {
        ...content,
        status: 'editing',
        publications: content.publications?.map((row) =>
          row.id === params.publicationId
            ? { ...row, status: 'edit_queued', pendingCaption: body.caption }
            : row,
        ),
      }
      contents = contents.map((item) => (item.id === updated.id ? updated : item))
      setTimeout(() => {
        contents = contents.map((item) => {
          if (item.id !== updated.id) return item
          const publications = item.publications?.map((row) =>
            row.id === params.publicationId && row.status === 'edit_queued'
              ? {
                  ...row,
                  status: 'published' as const,
                  captionOverride: body.caption,
                  pendingCaption: undefined,
                }
              : row,
          )
          return {
            ...item,
            status: publications?.every((row) => row.status === 'published')
              ? 'published'
              : item.status,
            publications,
          }
        })
      }, 800)
      return HttpResponse.json(
        envelope(updated, `/brands/${String(params.brandId)}/planning/${updated.id}`),
        { status: 202 },
      )
    },
  ),
  http.delete(
    '/api/brands/:brandId/planning/publications/:publicationId/published',
    ({ params }) => {
      const content = contents.find((item) =>
        item.publications?.some((row) => row.id === params.publicationId),
      )
      if (!content) return new HttpResponse(null, { status: 404 })
      const publications = content.publications?.map((row) =>
        row.id === params.publicationId ? { ...row, status: 'deleted' as const } : row,
      )
      const updated: PlanningContent = {
        ...content,
        status: publications?.every((row) => row.status === 'deleted') ? 'deleted' : 'partial',
        publications,
      }
      contents = contents.map((item) => (item.id === updated.id ? updated : item))
      return HttpResponse.json(
        envelope(updated, `/brands/${String(params.brandId)}/planning/${updated.id}`),
      )
    },
  ),
  http.post('/api/brands/:brandId/planning/:contentId/reconcile-unknown', ({ params }) => {
    const content = contents.find((item) => item.id === params.contentId)
    if (!content) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(
      envelope(content, `/brands/${String(params.brandId)}/planning/${content.id}`),
    )
  }),
  http.delete('/api/brands/:brandId/planning/publications/:publicationId/unknown', ({ params }) => {
    const content = contents.find((item) =>
      item.publications?.some((row) => row.id === params.publicationId),
    )
    if (!content) return new HttpResponse(null, { status: 404 })
    const publications = content.publications?.map((row) =>
      row.id === params.publicationId ? { ...row, status: 'cancelled' as const } : row,
    )
    const updated: PlanningContent = {
      ...content,
      status: publications?.every((row) => row.status === 'cancelled') ? 'cancelled' : 'partial',
      publications,
    }
    contents = contents.map((item) => (item.id === updated.id ? updated : item))
    return HttpResponse.json(
      envelope(updated, `/brands/${String(params.brandId)}/planning/${updated.id}`),
    )
  }),
]

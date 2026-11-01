import { describe, expect, it } from 'vitest'
import type { PlanningContent } from '../api'
import { approvalStatusLabelKey, approvalTransitions, pendingApprovalIntent } from './approval'
import {
  allowedIntent,
  createComposerDraft,
  getPlanningContentIntent,
  toCreatePlanningContentInput,
} from './composer'

const content = (overrides: Partial<PlanningContent> = {}): PlanningContent => ({
  id: 'content-1',
  version: 1,
  caption: 'Hello',
  mediaType: 'text',
  type: 'facebook_feed',
  platform: 'facebook',
  targets: [],
  status: 'draft',
  approvalStatus: 'none',
  createdAt: '2026-10-30T00:00:00Z',
  createdBy: 'User',
  ...overrides,
})

const approver = { canApprove: true, canSubmit: true }
const editor = { canApprove: false, canSubmit: true }

describe('approval transitions', () => {
  it('lets approvers decide and only the submitter withdraw a pending post', () => {
    const pending = content({ approvalStatus: 'pending', approvalRequestedById: 'editor-1' })
    expect(approvalTransitions(pending, { ...approver, userId: 'admin-1' })).toEqual([
      'approved',
      'rejected',
    ])
    expect(approvalTransitions(pending, { ...editor, userId: 'editor-1' })).toEqual(['none'])
    expect(approvalTransitions(pending, { ...editor, userId: 'editor-2' })).toEqual([])
  })

  it('lets authors submit drafts and resubmit rejected posts', () => {
    expect(approvalTransitions(content(), editor)).toEqual(['pending'])
    expect(approvalTransitions(content({ approvalStatus: 'rejected' }), editor)).toEqual([
      'pending',
      'none',
    ])
  })

  it('freezes approval once the post is scheduled or publishing', () => {
    const scheduled = content({ status: 'scheduled', approvalStatus: 'approved' })
    expect(approvalTransitions(scheduled, approver)).toEqual([])
    expect(approvalTransitions(content(), { canApprove: false, canSubmit: false })).toEqual([])
  })
})

describe('publish intents by permission', () => {
  it('routes publishing through approval without direct publishing', () => {
    expect(allowedIntent('publish_now', false)).toBe('approval_publish_now')
    expect(allowedIntent('schedule', false)).toBe('approval_schedule')
    expect(allowedIntent('schedule', true)).toBe('schedule')
  })

  it('reopens posts with the action they were saved with', () => {
    expect(
      getPlanningContentIntent(
        content({ approvalStatus: 'pending', approvalIntent: 'schedule' }),
        true,
      ),
    ).toBe('approval_schedule')
    const scheduled = content({ status: 'scheduled', approvalStatus: 'approved' })
    expect(getPlanningContentIntent(scheduled, true)).toBe('schedule')
    expect(getPlanningContentIntent(scheduled, false)).toBe('approval_schedule')
  })

  it('keeps the chosen time when submitting a scheduled post for approval', () => {
    const scheduledAt = new Date(Date.now() + 3_600_000).toISOString()
    const input = toCreatePlanningContentInput(
      'brand-1',
      { ...createComposerDraft('facebook'), targetIds: ['page-a'], caption: 'Hi', scheduledAt },
      'approval_schedule',
    )
    expect(input.intent).toBe('approval_schedule')
    expect(input.publications[0]?.scheduledAt).toBe(scheduledAt)
  })
})

describe('approval labels', () => {
  it('names "no approval" by context so it does not read as a rejection', () => {
    expect(approvalStatusLabelKey(content())).toBe('approvalStatus.notSubmitted')
    expect(approvalStatusLabelKey(content({ status: 'scheduled' }))).toBe(
      'approvalStatus.notRequired',
    )
    expect(approvalStatusLabelKey(content({ approvalStatus: 'pending' }))).toBe(
      'approvalStatus.pending',
    )
  })

  it('tells how a pending post goes out once approved', () => {
    expect(pendingApprovalIntent(content())).toBeNull()
    expect(
      pendingApprovalIntent(content({ approvalStatus: 'pending', approvalIntent: 'schedule' })),
    ).toBe('schedule')
    expect(pendingApprovalIntent(content({ approvalStatus: 'pending' }))).toBe('publish_now')
  })
})

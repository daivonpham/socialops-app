import { describe, expect, it } from 'vitest'
import type { PlanningContent } from '../api'
import {
  canSubmitComposer,
  createComposerDraft,
  createComposerDraftFromContent,
  setComposerCaptionMode,
  toCreatePlanningContentInput,
  type PlanningComposerDraft,
} from './composer'

const draft = (overrides: Partial<PlanningComposerDraft> = {}): PlanningComposerDraft => ({
  ...createComposerDraft('facebook'),
  targetIds: ['page-a', 'page-b'],
  caption: 'Shared',
  ...overrides,
})

describe('per-account captions', () => {
  it('sends the shared caption only while per-account captions are off', () => {
    const input = toCreatePlanningContentInput(
      'brand-1',
      draft({ captionOverrides: { 'page-a': 'Kept for later' } }),
      'draft',
    )
    expect(input.captionMode).toBe('shared')
    expect(input.caption).toBe('Shared')
    expect(input.publications.map((item) => item.captionOverride)).toEqual([undefined, undefined])
  })

  it('starts every account from the shared caption and sends each caption', () => {
    const enabled = setComposerCaptionMode(
      draft({ captionOverrides: { 'page-b': ' Only B ' } }),
      'per_target',
    )
    expect(enabled.captionOverrides).toEqual({ 'page-a': 'Shared', 'page-b': ' Only B ' })
    const input = toCreatePlanningContentInput('brand-1', enabled, 'draft')
    expect(input.captionMode).toBe('per_target')
    expect(input.publications.map((item) => item.captionOverride)).toEqual(['Shared', 'Only B'])
  })

  it('validates each account caption instead of the shared caption', () => {
    const perAccount = draft({
      caption: '',
      captionMode: 'per_target',
      captionOverrides: { 'page-a': 'A', 'page-b': '' },
    })
    expect(canSubmitComposer(perAccount)).toBe(false)
    expect(
      canSubmitComposer({ ...perAccount, captionOverrides: { 'page-a': 'A', 'page-b': 'B' } }),
    ).toBe(true)
    expect(canSubmitComposer({ ...perAccount, captionMode: 'shared' })).toBe(false)
  })

  it('falls back to the shared caption for a single account', () => {
    const input = toCreatePlanningContentInput(
      'brand-1',
      draft({ targetIds: ['page-a'], captionMode: 'per_target' }),
      'draft',
    )
    expect(input.captionMode).toBe('shared')
    expect(input.publications[0]?.captionOverride).toBeUndefined()
  })

  it('restores the caption mode when editing a saved post', () => {
    const target = { id: 'page-a', name: 'A' }
    const content = {
      id: 'content-1',
      version: 1,
      caption: 'A',
      captionMode: 'per_target',
      mediaType: 'text',
      type: 'facebook_feed',
      platform: 'facebook',
      targets: [target, { id: 'page-b', name: 'B' }],
      publications: [
        { id: 'p-a', socialAccountId: 'page-a', target, captionOverride: 'A', status: 'draft' },
        {
          id: 'p-b',
          socialAccountId: 'page-b',
          target: { id: 'page-b', name: 'B' },
          captionOverride: 'B',
          status: 'draft',
        },
      ],
      status: 'draft',
      approvalStatus: 'none',
      createdAt: '2026-10-30T00:00:00Z',
      createdBy: 'User',
    } satisfies PlanningContent
    expect(createComposerDraftFromContent(content)).toMatchObject({
      captionMode: 'per_target',
      captionOverrides: { 'page-a': 'A', 'page-b': 'B' },
    })
  })
})

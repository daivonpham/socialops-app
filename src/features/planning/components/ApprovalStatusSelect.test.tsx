import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderRoutes, scopeValue } from '@/test/render'
import { server } from '@/test/server'
import type { PlanningContent } from '../api'
import { ApprovalButtons } from './ApprovalStatusSelect'

const post = (extra: Partial<PlanningContent> = {}) =>
  ({
    id: 'content-1',
    platform: 'tiktok',
    status: 'draft',
    approvalStatus: 'pending',
    platformSettings: { mode: 'direct', privacyLevel: 'SELF_ONLY' },
    ...extra,
  }) as unknown as PlanningContent

describe('Approving a post', () => {
  const sent: unknown[] = []
  beforeEach(() => {
    sent.length = 0
    server.use(
      http.patch('*/api/brands/:brandId/planning/:contentId/approval', async ({ request }) => {
        sent.push(await request.json())
        return HttpResponse.json({ data: post({ approvalStatus: 'approved' }) })
      }),
    )
  })

  const renderButtons = (content: PlanningContent) =>
    renderRoutes([{ path: '/', element: <ApprovalButtons content={content} canApprove /> }], {
      scope: scopeValue({ workspaceId: 'ws-1', brandId: 'brand-1' }),
    })

  it('shows TikTok’s terms before a TikTok post is approved, since approving sends it', async () => {
    renderButtons(post())
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    const dialog = await screen.findByRole('dialog', { name: 'Approve and send to TikTok?' })
    expect(within(dialog).getByRole('link', { name: 'Music Usage Confirmation' })).toHaveAttribute(
      'href',
      'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en',
    )
    expect(within(dialog).queryByRole('link', { name: 'Branded Content Policy' })).toBeNull()
    expect(sent).toEqual([])

    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }))
    await waitFor(() => expect(sent).toEqual([{ approvalStatus: 'approved' }]))
  })

  it('adds the Branded Content Policy for branded content', async () => {
    renderButtons(
      post({
        platformSettings: {
          mode: 'direct',
          privacyLevel: 'PUBLIC_TO_EVERYONE',
          commercialContent: true,
          brandContent: 'true',
        },
      }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('link', { name: 'Branded Content Policy' })).toHaveAttribute(
      'href',
      'https://www.tiktok.com/legal/page/global/bc-policy/en',
    )
  })

  it('sends nothing when the approver cancels', async () => {
    renderButtons(post())
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(sent).toEqual([])
  })

  it('approves a Facebook post at once, and rejects without asking', async () => {
    renderButtons(post({ platform: 'facebook', platformSettings: {} }))
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    await waitFor(() => expect(sent).toEqual([{ approvalStatus: 'approved' }]))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('rejects a TikTok post without the terms', async () => {
    renderButtons(post())
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    await waitFor(() => expect(sent).toEqual([{ approvalStatus: 'rejected' }]))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

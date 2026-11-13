import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderRoutes, scopeValue } from '@/test/render'
import { server } from '@/test/server'
import { i18n } from '@/shared/i18n'
import type { PlanningContent } from '../api'
import { ApprovalButtons } from './ApprovalStatusSelect'

const waiting = {
  id: 'content-1',
  status: 'draft',
  approvalStatus: 'pending',
  approvalRequestedById: 'editor-1',
} as PlanningContent

function renderButtons(content: PlanningContent, canApprove: boolean) {
  renderRoutes(
    [{ path: '/', element: <ApprovalButtons content={content} canApprove={canApprove} /> }],
    {
      scope: scopeValue({ workspaceId: 'ws-1', brandId: 'brand-1' }),
    },
  )
  return userEvent.setup()
}

describe('ApprovalButtons', () => {
  beforeEach(() => {
    i18n.changeLanguage('en-US')
  })

  it('approves or rejects a post waiting on this approver', async () => {
    const sent: unknown[] = []
    server.use(
      http.patch('*/brands/brand-1/planning/content-1/approval', async ({ request }) => {
        sent.push(await request.json())
        return HttpResponse.json({ data: waiting })
      }),
    )
    const user = renderButtons(waiting, true)
    await user.click(screen.getByRole('button', { name: /Reject/ }))
    await waitFor(() => expect(sent).toEqual([{ approvalStatus: 'rejected' }]))
    await user.click(screen.getByRole('button', { name: /Approve/ }))
    await waitFor(() => expect(sent).toHaveLength(2))
    expect(sent[1]).toEqual({ approvalStatus: 'approved' })
    expect(await screen.findByText('Post approved.')).toBeInTheDocument()
  })

  it('shows nothing to someone who cannot approve, or once it is decided', () => {
    renderButtons(waiting, false)
    renderButtons({ ...waiting, approvalStatus: 'approved' }, true)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

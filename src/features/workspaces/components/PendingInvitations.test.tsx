import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoutes, scopeValue } from '@/test/render'
import { server } from '@/test/server'
import type { MyInvitationDto } from '../api'
import { PendingInvitations } from './PendingInvitations'

const invitation: MyInvitationDto = {
  id: 'inv-1',
  workspaceId: 'ws-1',
  workspaceName: 'North Agency',
  inviterName: 'Lan',
  role: 'editor',
  expiresAt: '2026-10-30T00:00:00.000Z',
  createdAt: '2026-10-23T00:00:00.000Z',
}

const selectBrand = vi.fn<(workspaceId: string, brandId: string) => void>()
const setWorkspace = vi.fn<(workspaceId: string | null) => void>()

const onDone = vi.fn()

function renderInbox() {
  return renderRoutes([{ path: '/', element: <PendingInvitations onDone={onDone} /> }], {
    scope: scopeValue({ selectBrand, setWorkspace }),
  })
}

describe('PendingInvitations', () => {
  let pending: MyInvitationDto[]
  const calls: string[] = []

  beforeEach(() => {
    pending = [invitation]
    calls.length = 0
    server.use(
      http.get('*/api/invitations/mine', () => HttpResponse.json({ data: pending })),
      http.get('*/api/workspaces/:id/brands', () =>
        HttpResponse.json({ data: [{ id: 'brand-1', name: 'First Brand' }] }),
      ),
      http.post('*/api/invitations/:id/accept', ({ params }) => {
        calls.push(`accept:${String(params.id)}`)
        pending = []
        return HttpResponse.json({ data: { workspaceId: invitation.workspaceId } })
      }),
      http.post('*/api/invitations/:id/decline', ({ params }) => {
        calls.push(`decline:${String(params.id)}`)
        pending = []
        return new HttpResponse(null, { status: 204 })
      }),
    )
  })

  it('shows the invitation details', async () => {
    renderInbox()
    const section = await screen.findByRole('region', { name: 'Pending invitations' })
    expect(within(section).getByText('Lan invited you to join North Agency')).toBeInTheDocument()
    expect(screen.getByText(/Editor/)).toBeInTheDocument()
  })

  it('accepts an invitation and opens the joined workspace', async () => {
    renderInbox()
    await userEvent.click(await screen.findByRole('button', { name: 'Accept' }))

    await waitFor(() => expect(calls).toEqual(['accept:inv-1']))
    // The user lands in the joined workspace with its first Brand open.
    await waitFor(() => expect(selectBrand).toHaveBeenCalledWith('ws-1', 'brand-1'))
    expect(await screen.findByText('You joined North Agency.')).toBeInTheDocument()
    expect(onDone).toHaveBeenCalled()
  })

  it('declines an invitation and removes it', async () => {
    renderInbox()
    await userEvent.click(await screen.findByRole('button', { name: 'Decline' }))

    await waitFor(() => expect(calls).toEqual(['decline:inv-1']))
    expect(selectBrand).not.toHaveBeenCalled()
    expect(setWorkspace).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Pending invitations' })).not.toBeInTheDocument(),
    )
  })
})

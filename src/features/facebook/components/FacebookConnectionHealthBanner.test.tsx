import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { FacebookPageDto } from '../api'
import { FacebookConnectionHealthBanner } from './FacebookConnectionHealthBanner'

const page = (overrides: Partial<FacebookPageDto>): FacebookPageDto => ({
  id: 'p1',
  name: 'Coffee House',
  username: 'coffee',
  category: '',
  followersCount: 10,
  health: 'connected',
  reconnectBy: null,
  lastSyncedAt: '2026-10-24T00:00:00.000Z',
  ...overrides,
})

describe('FacebookConnectionHealthBanner', () => {
  it('stays hidden while every Page is healthy', () => {
    const { container } = render(
      <FacebookConnectionHealthBanner
        pages={[page({})]}
        canManage
        reconnecting={false}
        onReconnect={() => {}}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('names paused Pages and reconnects in one step', async () => {
    const onReconnect = vi.fn()
    render(
      <FacebookConnectionHealthBanner
        pages={[
          page({ health: 'token_expired' }),
          page({ id: 'p2', name: 'Tea Corner', health: 'permission_missing' }),
          page({ id: 'p3', name: 'Expiring', health: 'token_expiring' }),
        ]}
        canManage
        reconnecting={false}
        onReconnect={onReconnect}
      />,
    )
    expect(screen.getByText('2 Pages need Facebook reconnected')).toBeInTheDocument()
    expect(screen.getByText(/Coffee House and Tea Corner/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reconnect Facebook' }))
    expect(onReconnect).toHaveBeenCalledOnce()
  })

  it('warns ahead of the earliest expiry date', () => {
    render(
      <FacebookConnectionHealthBanner
        pages={[
          page({ health: 'token_expiring', reconnectBy: '2026-11-02T00:00:00.000Z' }),
          page({ id: 'p2', health: 'token_expiring', reconnectBy: '2026-10-30T00:00:00.000Z' }),
        ]}
        canManage
        reconnecting={false}
        onReconnect={() => {}}
      />,
    )
    expect(screen.getByText('Facebook connection expires on 10/30/2026')).toBeInTheDocument()
  })

  it('tells members without connection rights whom to ask', () => {
    render(
      <FacebookConnectionHealthBanner
        pages={[page({ health: 'token_expired' })]}
        canManage={false}
        reconnecting={false}
        onReconnect={() => {}}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Reconnect Facebook' })).not.toBeInTheDocument()
    expect(screen.getByText(/Ask whoever manages this brand/)).toBeInTheDocument()
  })
})

import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoutes, scopeValue } from '@/test/render'
import { server } from '@/test/server'
import { createComposerDraft, type PlanningAccount } from '../../model'
import { TikTokPostSettings } from './TikTokPostSettings'

const accounts = [
  { id: 'a-public', name: 'Shop public', platform: 'tiktok' },
  { id: 'a-private', name: 'Shop private', platform: 'tiktok' },
] as unknown as PlanningAccount[]

const info = (accountId: string, extra: Record<string, unknown> = {}) => ({
  accountId,
  creatorNickname: accountId === 'a-public' ? 'Shop Public' : 'Shop Private',
  creatorUsername: accountId,
  privacyLevelOptions:
    accountId === 'a-public'
      ? ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY']
      : ['FOLLOWER_OF_CREATOR', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
  commentDisabled: false,
  duetDisabled: accountId === 'a-private',
  stitchDisabled: accountId === 'a-private',
  maxVideoPostDurationSec: 600,
  canUploadDrafts: true,
  ...extra,
})

describe('TikTokPostSettings', () => {
  let failing: string | null
  const onBlockedChange = vi.fn<(blocked: boolean) => void>()

  beforeEach(() => {
    failing = null
    onBlockedChange.mockReset()
    server.use(
      http.get('*/api/brands/:brandId/tiktok/creator-info', ({ request }) => {
        const accountId = new URL(request.url).searchParams.get('accountId')!
        return accountId === failing
          ? HttpResponse.json(
              {
                error: {
                  code: 'TIKTOK_DAILY_POST_LIMIT',
                  message: 'The daily post cap is reached',
                },
              },
              { status: 409 },
            )
          : HttpResponse.json({ data: info(accountId) })
      }),
    )
  })

  function Harness({ chosen }: { chosen: PlanningAccount[] }) {
    const [draft, setDraft] = useState(() => ({
      ...createComposerDraft('tiktok'),
      targetIds: chosen.map((account) => account.id),
    }))
    return (
      <TikTokPostSettings
        draft={draft}
        setDraft={setDraft}
        accounts={chosen}
        onBlockedChange={onBlockedChange}
      />
    )
  }

  const renderSettings = (chosen = accounts) =>
    renderRoutes([{ path: '/', element: <Harness chosen={chosen} /> }], {
      scope: scopeValue({ workspaceId: 'ws-1', brandId: 'brand-1' }),
    })

  it('shows each creator, offers only shared audiences with none chosen, and ticks nothing', async () => {
    renderSettings()
    const creators = await screen.findByRole('list', { name: /./ })
    expect(await within(creators).findByText('Shop Public')).toBeInTheDocument()
    expect(within(creators).getByText('@a-private')).toBeInTheDocument()
    // TikTok forbids a default audience.
    expect(await screen.findByText('Choose who can view')).toBeInTheDocument()
    // Interactions start unticked; Duet and Stitch lock because the private account turned them off.
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.every((box) => !(box as HTMLInputElement).checked)).toBe(true)
    await waitFor(() => expect(onBlockedChange).toHaveBeenLastCalledWith(false))
  })

  it('explains that public posts wait for TikTok’s approval of the app', async () => {
    server.use(
      http.get('*/api/brands/:brandId/tiktok/creator-info', ({ request }) => {
        const accountId = new URL(request.url).searchParams.get('accountId')!
        return HttpResponse.json({
          data: info(accountId, {
            privacyLevelOptions: ['MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
            publicPostingPending: true,
          }),
        })
      }),
    )
    renderSettings([accounts[0]!])
    expect(
      await screen.findByText(
        'Public posts open once TikTok has approved SocialOps. Until then TikTok only accepts private ones.',
      ),
    ).toBeInTheDocument()
  })

  it('blocks posting while an account cannot post, and says so', async () => {
    failing = 'a-private'
    renderSettings()
    expect(
      await screen.findByText(
        'TikTok does not let one of the accounts post right now. Try again later.',
      ),
    ).toBeInTheDocument()
    await waitFor(() => expect(onBlockedChange).toHaveBeenLastCalledWith(true))
  })

  it('blocks posting until the creators are known', async () => {
    renderSettings()
    // The first report comes while creator info is still loading.
    expect(onBlockedChange.mock.calls[0]).toEqual([true])
    await waitFor(() => expect(onBlockedChange).toHaveBeenLastCalledWith(false))
  })

  it('puts the music terms right above the post button', async () => {
    renderSettings([accounts[0]!])
    const link = await screen.findByRole('link', { name: 'Music Usage Confirmation' })
    expect(link).toHaveAttribute(
      'href',
      'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en',
    )
    expect(
      screen.getByText(
        'After posting, TikTok may take a few minutes to process the post before it appears on the profile.',
      ),
    ).toBeInTheDocument()
  })
})

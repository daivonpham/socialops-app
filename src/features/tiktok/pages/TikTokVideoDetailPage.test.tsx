import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoutes, scopeValue } from '@/test/render'
import { server } from '@/test/server'
import type { TikTokVideoDetailDto } from '../api'
import TikTokVideoDetailPage from './TikTokVideoDetailPage'

const detail = (extra: Partial<TikTokVideoDetailDto> = {}): TikTokVideoDetailDto => ({
  video: {
    id: 'v-1',
    accountId: 'a-1',
    accountName: 'Shop A',
    title: 'Cold brew launch',
    shareUrl: 'https://www.tiktok.com/@shop/video/1',
    createdAt: '2026-11-20T03:00:00.000Z',
    duration: 30,
    isAigc: false,
    views: 650,
    likes: 65,
    comments: 0,
    shares: 0,
    engagements: 65,
    engagementRate: 10,
  },
  firstSeenAt: '2026-11-20T03:10:00.000Z',
  lastSyncedAt: '2026-11-21T08:00:00.000Z',
  removed: false,
  series: [
    { date: '2026-11-20', views: 300, likes: 30, comments: 0, shares: 0, totalViews: 300 },
    { date: '2026-11-21', views: 350, likes: 35, comments: 0, shares: 0, totalViews: 650 },
  ],
  accountAverage: { videos: 4, views: 500, likes: 20, comments: 1, shares: 0 },
  ...extra,
})

describe('TikTokVideoDetailPage', () => {
  let response: () => Response

  beforeEach(() => {
    response = () => HttpResponse.json({ data: detail() })
    server.use(http.get('*/api/brands/:brandId/tiktok/videos/:videoId', () => response()))
  })

  const renderPage = () =>
    renderRoutes(
      [
        { path: '/platforms/tiktok/overview/videos/:videoId', element: <TikTokVideoDetailPage /> },
        { path: '/platforms/tiktok/overview', element: <p>Overview</p> },
      ],
      {
        initialPath: '/platforms/tiktok/overview/videos/v-1',
        scope: scopeValue({ workspaceId: 'ws-1', brandId: 'brand-1' }),
      },
    )

  it('shows the video, its counts against the account average and a link to TikTok', async () => {
    renderPage()
    expect((await screen.findAllByText('Cold brew launch')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('650').length).toBeGreaterThan(0)
    // 650 views against an average of 500.
    expect(screen.getByLabelText('+30%, vs. account average 500')).toBeInTheDocument()
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    await userEvent.click(screen.getByRole('button', { name: /Open on TikTok/ }))
    expect(open).toHaveBeenCalledWith(
      'https://www.tiktok.com/@shop/video/1',
      '_blank',
      'noopener,noreferrer',
    )
    open.mockRestore()
    expect(screen.queryByText('No longer public')).not.toBeInTheDocument()
  })

  it('says when the video is no longer public, keeping its last counts', async () => {
    response = () => HttpResponse.json({ data: detail({ removed: true }) })
    renderPage()
    expect(await screen.findByText('No longer public')).toBeInTheDocument()
    expect(screen.getAllByText('650').length).toBeGreaterThan(0)
  })

  it('says a video that is not there was not found, and leads back', async () => {
    response = () =>
      HttpResponse.json(
        { error: { code: 'RESOURCE_NOT_FOUND', message: 'TikTok video was not found' } },
        { status: 404 },
      )
    renderPage()
    expect(await screen.findByText('Video not found')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Back to TikTok' }).at(-1)!)
    expect(await screen.findByText('Overview')).toBeInTheDocument()
  })

  it('offers to try again after another error', async () => {
    response = () => HttpResponse.json({ error: { code: 'X', message: 'x' } }, { status: 500 })
    renderPage()
    expect(await screen.findByText('The video could not be loaded.')).toBeInTheDocument()
    response = () => HttpResponse.json({ data: detail() })
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect((await screen.findAllByText('Cold brew launch')).length).toBeGreaterThan(0)
  })
})

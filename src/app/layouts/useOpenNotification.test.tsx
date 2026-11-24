import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NotificationOpen } from '@/features/notifications'
import { renderRoutes, scopeValue } from '@/test/render'
import { server } from '@/test/server'
import { useOpenNotification } from './useOpenNotification'

const selectBrand = vi.fn<(workspaceId: string, brandId: string) => void>()
const setWorkspace = vi.fn<(workspaceId: string | null) => void>()

/** Renders the hook on a route and hands back its `open` and the router. */
function setup() {
  let open: ((value: NotificationOpen) => Promise<void>) | undefined
  function Probe() {
    open = useOpenNotification()
    return null
  }
  const view = renderRoutes([{ path: '*', element: <Probe /> }], {
    initialPath: '/all-platforms',
    scope: scopeValue({ workspaceId: 'ws-1', brandId: 'brand-1', selectBrand, setWorkspace }),
  })
  const location = () =>
    `${view.router.state.location.pathname}${view.router.state.location.search}`
  return { open: (value: NotificationOpen) => act(() => open!(value)), location }
}

describe('useOpenNotification', () => {
  beforeEach(() => {
    selectBrand.mockReset()
    setWorkspace.mockReset()
    server.use(
      http.get('*/api/workspaces/:workspaceId/brands', ({ params }) =>
        HttpResponse.json({
          data:
            params.workspaceId === 'ws-empty'
              ? []
              : [
                  { id: 'brand-1', name: 'Cafe' },
                  { id: 'brand-2', name: 'Bakery' },
                ],
        }),
      ),
    )
  })

  it('opens a post in its own Brand, switching to it', async () => {
    const { open, location } = setup()
    await open({
      target: { kind: 'planning', platform: 'tiktok', contentId: 'content-1' },
      workspaceId: 'ws-2',
      brandId: 'brand-2',
    })
    expect(selectBrand).toHaveBeenCalledWith('ws-2', 'brand-2')
    await waitFor(() => expect(location()).toBe('/platforms/tiktok/planning?content=content-1'))
  })

  it('opens the AI chat when the turn made no post', async () => {
    const { open, location } = setup()
    await open({
      target: { kind: 'planning', platform: 'facebook', contentId: null, chatId: 'chat-1' },
      workspaceId: 'ws-1',
      brandId: 'brand-1',
    })
    await waitFor(() => expect(location()).toBe('/platforms/facebook/planning?aiChat=chat-1'))
  })

  it('lands in another Brand without opening the post when its own Brand is out of reach', async () => {
    const { open, location } = setup()
    await open({
      target: { kind: 'planning', platform: 'facebook', contentId: 'content-9' },
      workspaceId: 'ws-1',
      brandId: 'brand-gone',
    })
    expect(selectBrand).toHaveBeenCalledWith('ws-1', 'brand-1')
    await waitFor(() => expect(location()).toBe('/platforms/facebook/planning'))
  })

  it('enters a Workspace with no Brand, and goes to members for a Workspace notice', async () => {
    const { open, location } = setup()
    await open({ target: { kind: 'members' }, workspaceId: 'ws-empty', brandId: null })
    expect(setWorkspace).toHaveBeenCalledWith('ws-empty')
    expect(selectBrand).not.toHaveBeenCalled()
    await waitFor(() => expect(location()).toBe('/members'))
  })

  it('goes to the channel screen, and stays put for an invitation', async () => {
    const { open, location } = setup()
    await open({
      target: { kind: 'channels', platform: 'tiktok' },
      workspaceId: 'ws-1',
      brandId: 'brand-1',
    })
    await waitFor(() => expect(location()).toBe('/platforms/tiktok/overview'))
    await open({ target: { kind: 'none' }, workspaceId: null, brandId: null })
    expect(location()).toBe('/platforms/tiktok/overview')
  })
})

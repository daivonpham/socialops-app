import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoutes } from '@/test/render'
import { server } from '@/test/server'
import type { PlanningContent } from '../api'
import { useLinkedContent } from './use-linked-content'

const onOpen = vi.fn<(content: PlanningContent) => void>()
const onMissing = vi.fn<() => void>()

function setup(path: string, brandId: string | null = 'brand-1') {
  function Probe() {
    useLinkedContent(brandId, onOpen, onMissing)
    return null
  }
  const view = renderRoutes([{ path: '*', element: <Probe /> }], { initialPath: path })
  return () => `${view.router.state.location.pathname}${view.router.state.location.search}`
}

describe('useLinkedContent', () => {
  const asked: string[] = []
  beforeEach(() => {
    onOpen.mockReset()
    onMissing.mockReset()
    asked.length = 0
    server.use(
      http.get('*/api/brands/:brandId/planning/:contentId', ({ params }) => {
        asked.push(`${String(params.brandId)}/${String(params.contentId)}`)
        return params.contentId === 'gone'
          ? HttpResponse.json(
              { error: { code: 'RESOURCE_NOT_FOUND', message: 'Content was not found' } },
              { status: 404 },
            )
          : HttpResponse.json({ data: { id: params.contentId, caption: 'Hi' } })
      }),
    )
  })

  it('opens the linked post once, then takes the link off the address', async () => {
    const location = setup('/platforms/facebook/planning?view=list&content=content-1')
    await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1))
    expect(onOpen.mock.calls[0]![0]).toMatchObject({ id: 'content-1' })
    // Other filters stay.
    await waitFor(() => expect(location()).toBe('/platforms/facebook/planning?view=list'))
    expect(onMissing).not.toHaveBeenCalled()
    expect(asked).toEqual(['brand-1/content-1'])
  })

  it('says a post it cannot open is missing', async () => {
    const location = setup('/platforms/facebook/planning?content=gone')
    await waitFor(() => expect(onMissing).toHaveBeenCalledTimes(1))
    expect(onOpen).not.toHaveBeenCalled()
    await waitFor(() => expect(location()).toBe('/platforms/facebook/planning'))
  })

  it('waits for a Brand before asking, and asks nothing without a link', async () => {
    setup('/platforms/facebook/planning?content=content-1', null)
    setup('/platforms/facebook/planning')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(asked).toEqual([])
    expect(onOpen).not.toHaveBeenCalled()
    expect(onMissing).not.toHaveBeenCalled()
  })
})

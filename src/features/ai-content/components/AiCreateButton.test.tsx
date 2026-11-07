import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoutes } from '@/test/render'
import { server } from '@/test/server'
import { i18n } from '@/shared/i18n'
import type { AiAvailability, AiGeneration } from '../api'
import { AiCreateButton } from './AiCreateButton'

// The real preview is antd's, loaded lazily; a plain stand-in keeps these tests quick.
vi.mock('@/shared/components/ant/Image', () => ({
  Image: ({ src, alt }: { src?: string; alt: string }) => <img src={src} alt={alt} />,
  ImagePreviewGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const AVAILABLE: AiAvailability = {
  enabled: true,
  canGenerate: true,
  canManageChannels: true,
  pages: [
    { id: 'page-a', name: 'Page A' },
    { id: 'page-b', name: 'Page B' },
  ],
  hasProfile: true,
}

const generation = (overrides: Partial<AiGeneration>): AiGeneration => ({
  id: 'gen-1',
  status: 'running',
  phase: 'writing',
  wantsImage: false,
  contentId: null,
  errorCode: null,
  imageErrorCode: null,
  ...overrides,
})

function mockApi(availability: Partial<AiAvailability> = {}) {
  server.use(
    http.get('*/brands/brand-1/ai/availability', () =>
      HttpResponse.json({ data: { ...AVAILABLE, ...availability } }),
    ),
    http.get('*/brands/brand-1/ai/templates', () => HttpResponse.json({ data: [] })),
  )
}

function renderButton() {
  const onOpenContent = vi.fn()
  const onCreated = vi.fn()
  renderRoutes([
    {
      path: '/',
      element: (
        <AiCreateButton brandId="brand-1" onOpenContent={onOpenContent} onCreated={onCreated} />
      ),
    },
  ])
  return { onOpenContent, onCreated, user: userEvent.setup() }
}

describe('AiCreateButton', () => {
  beforeEach(() => i18n.changeLanguage('en-US'))

  it.each([
    ['AI is switched off', { enabled: false }],
    ['this person cannot create posts', { canGenerate: false }],
  ])('stays hidden when %s', async (_, availability) => {
    mockApi(availability)
    renderButton()
    await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument())
  })

  it('starts one generation, follows it and opens the post', async () => {
    mockApi()
    const keys: string[] = []
    let body: unknown
    let polls = 0
    server.use(
      http.post('*/brands/brand-1/ai/generations', async ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key') ?? '')
        body = await request.json()
        return HttpResponse.json({ data: { id: 'gen-1' } }, { status: 201 })
      }),
      http.get('*/brands/brand-1/ai/generations/gen-1', () => {
        polls += 1
        return HttpResponse.json({
          data:
            polls < 2
              ? generation({ phase: 'writing' })
              : generation({ status: 'succeeded', phase: null, contentId: 'content-1' }),
        })
      }),
    )
    const { user, onOpenContent, onCreated } = renderButton()
    await user.click(await screen.findByRole('button', { name: /Create with AI/ }))
    const dialog = await screen.findByRole('dialog')
    await user.type(
      within(dialog).getByLabelText('What do you want to post about?'),
      ' New cold brew ',
    )
    await user.click(within(dialog).getByRole('checkbox', { name: 'Page B' }))
    await user.click(within(dialog).getByRole('button', { name: /Create post/ }))

    expect(await within(dialog).findByText('Writing the caption')).toBeInTheDocument()
    expect(body).toEqual({
      socialAccountIds: ['page-a', 'page-b'],
      brief: { topic: 'New cold brew' },
      wantsImage: false,
      autoSubmit: false,
    })
    expect(keys).toHaveLength(1)
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/)

    await user.click(
      await within(dialog).findByRole('button', { name: 'Open post' }, { timeout: 5000 }),
    )
    expect(onCreated).toHaveBeenCalled()
    expect(onOpenContent).toHaveBeenCalledWith('content-1')
  }, 10000)

  it('keeps the send button off until a brief and a Page are given', async () => {
    mockApi()
    let started = false
    server.use(
      http.post('*/brands/brand-1/ai/generations', () => {
        started = true
        return HttpResponse.json({ data: { id: 'gen-1' } })
      }),
    )
    const { user } = renderButton()
    await user.click(await screen.findByRole('button', { name: /Create with AI/ }))
    const dialog = await screen.findByRole('dialog')
    const send = within(dialog).getByRole('button', { name: /Create post/ })
    // No brief yet: the button stays off and no message is shown.
    expect(send).toBeDisabled()
    await user.type(within(dialog).getByLabelText('What do you want to post about?'), 'Cold brew')
    expect(send).toBeEnabled()
    // No Page left: off again.
    await user.click(within(dialog).getByRole('checkbox', { name: 'Page A' }))
    expect(send).toBeDisabled()
    await user.click(send)
    expect(started).toBe(false)
  })

  it('explains a failed generation in the customer’s words and starts afresh on retry', async () => {
    mockApi()
    const keys: string[] = []
    server.use(
      http.post('*/brands/brand-1/ai/generations', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key') ?? '')
        return HttpResponse.json({ data: { id: 'gen-1' } })
      }),
      http.get('*/brands/brand-1/ai/generations/gen-1', () =>
        HttpResponse.json({
          data: generation({ status: 'failed', phase: null, errorCode: 'AI_DISABLED' }),
        }),
      ),
    )
    const { user } = renderButton()
    await user.click(await screen.findByRole('button', { name: /Create with AI/ }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('What do you want to post about?'), 'Sale')
    await user.click(within(dialog).getByRole('button', { name: /Create post/ }))
    expect(
      await within(dialog).findByText('AI generation is turned off right now.'),
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Try again' }))
    await user.click(await within(dialog).findByRole('button', { name: /Create post/ }))
    await waitFor(() => expect(keys).toHaveLength(2))
    expect(keys[1]).not.toBe(keys[0])
  })

  it('invites setting up the Brand profile when there is none', async () => {
    mockApi({ hasProfile: false })
    const { user } = renderButton()
    await user.click(await screen.findByRole('button', { name: /Create with AI/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Set up Brand profile' })).toBeInTheDocument()
  })

  it('uploads picked files at once, shows progress, and lets the API delete a removed one', async () => {
    mockApi()
    const created: Array<{ name: string; mimeType: string }> = []
    const released: string[] = []
    let finishPdf: () => void = () => {}
    const pdfStored = new Promise<void>((resolve) => {
      finishPdf = resolve
    })
    server.use(
      http.post('*/brands/brand-1/ai/attachments', async ({ request }) => {
        const body = (await request.json()) as { name: string; mimeType: string }
        created.push(body)
        return HttpResponse.json(
          { data: { id: `att-${body.name}`, uploadUrl: `https://upload.test/${body.name}` } },
          { status: 201 },
        )
      }),
      http.put('https://upload.test/:name', async ({ params }) => {
        // The PDF stays in flight until the test lets it finish.
        if (params.name === 'brief.pdf') await pdfStored
        return new HttpResponse(null, { status: 200 })
      }),
      http.post('*/brands/brand-1/ai/attachments/:id/finalize', ({ params }) => {
        const name = String(params.id).replace('att-', '')
        return HttpResponse.json({
          data: {
            id: params.id,
            type: name.endsWith('.png') ? 'image' : 'document',
            name,
            url: `https://files.test/${name}`,
          },
        })
      }),
      http.delete('*/brands/brand-1/ai/attachments/:id', ({ params }) => {
        released.push(String(params.id))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const revokeUrl = vi.fn()
    // jsdom has no object URLs; give them for this test only.
    Object.assign(URL, { createObjectURL: () => 'blob:preview', revokeObjectURL: revokeUrl })
    const { user } = renderButton()
    await user.click(await screen.findByRole('button', { name: /Create with AI/ }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('What do you want to post about?'), 'Cold brew')
    const picker = dialog.querySelector<HTMLInputElement>('input[type="file"]')!
    await user.upload(picker, [
      new File(['x'], 'banner.png', { type: 'image/png' }),
      // Browsers often give Office and PDF files no type; the extension decides.
      new File(['x'], 'brief.pdf', { type: '' }),
    ])

    expect(created).toEqual([
      { name: 'banner.png', mimeType: 'image/png', sizeBytes: 1 },
      { name: 'brief.pdf', mimeType: 'application/pdf', sizeBytes: 1 },
    ])
    // Wait for the lazily loaded preview, which replaces the list once it arrives.
    expect(await within(dialog).findByRole('img', { name: 'banner.png' })).toBeInTheDocument()
    expect(within(dialog).getByRole('status', { name: 'Uploading brief.pdf' })).toBeInTheDocument()
    // Nothing is sent while a file is still uploading.
    expect(within(dialog).getByRole('button', { name: /Create post/ })).toBeDisabled()

    finishPdf()
    await waitFor(() =>
      expect(within(dialog).queryByRole('status', { name: /Uploading/ })).not.toBeInTheDocument(),
    )
    expect(within(dialog).getByRole('button', { name: /Create post/ })).toBeEnabled()

    const list = within(dialog).getByRole('list', { name: 'Attached files' })
    await user.click(within(list).getByRole('button', { name: 'Remove banner.png' }))
    await waitFor(() => expect(released).toEqual(['att-banner.png']))
    expect(revokeUrl).toHaveBeenCalledWith('blob:preview')
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    Reflect.deleteProperty(URL, 'createObjectURL')
    Reflect.deleteProperty(URL, 'revokeObjectURL')
  })
})

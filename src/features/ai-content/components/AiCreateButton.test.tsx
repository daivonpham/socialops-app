import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoutes } from '@/test/render'
import { server } from '@/test/server'
import { i18n } from '@/shared/i18n'
import type { AiAvailability, AiConversation, AiGeneration } from '../api'
import { AiCreateButton } from './AiCreateButton'

// The real preview is antd's, loaded lazily; a plain stand-in keeps these tests quick.
vi.mock('@/shared/components/ant/Image', () => ({
  Image: ({ src, alt }: { src?: string; alt: string }) => <img src={src} alt={alt} />,
  ImagePreviewGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const AVAILABLE: AiAvailability = {
  enabled: true,
  canGenerate: true,
  canPublishDirect: true,
  canManageChannels: true,
  pages: [
    { id: 'page-a', name: 'Page A' },
    { id: 'page-b', name: 'Page B' },
  ],
  hasProfile: true,
  needsOnboarding: false,
  historyDays: 30,
}
const CHAT_KEY = 'socialops.ai-chat.user-1.brand-1'

const turn = (overrides: Partial<AiGeneration> = {}): AiGeneration => ({
  id: 'gen-1',
  conversationId: 'conv-1',
  kind: 'new',
  createdAt: '2026-11-07T08:00:00.000Z',
  brief: { topic: 'New cold brew' },
  templateKey: null,
  socialAccountIds: ['page-a'],
  autoSubmit: false,
  attachments: [],
  suggestion: {
    captions: { 'page-a': 'Cold brew is here', 'page-b': 'Cold brew for B' },
    images: [
      {
        id: 'img-1',
        type: 'image',
        name: 'ai-1',
        url: 'https://files.test/ai-1',
        fromCustomer: false,
      },
    ],
  },
  status: 'succeeded',
  phase: null,
  imageAction: 'generate',
  unreadableFiles: [],
  usedBestPosts: false,
  contentId: null,
  errorCode: null,
  imageErrorCode: null,
  ...overrides,
})

const chat = (turns: AiGeneration[]): AiConversation => ({
  id: 'conv-1',
  title: 'New cold brew',
  lastActivityAt: '2026-11-07T08:00:00.000Z',
  turns,
})

function mockApi(availability: Partial<AiAvailability> = {}, conversation?: () => AiConversation) {
  server.use(
    http.get('*/brands/brand-1/ai/availability', () =>
      HttpResponse.json({ data: { ...AVAILABLE, ...availability } }),
    ),
    http.get('*/brands/brand-1/ai/templates', () => HttpResponse.json({ data: [] })),
    http.get('*/brands/brand-1/ai/conversations', () =>
      HttpResponse.json({
        data: [
          { id: 'conv-1', title: 'New cold brew', lastActivityAt: '2026-11-07T08:00:00.000Z' },
        ],
      }),
    ),
    ...(conversation
      ? [
          http.get('*/brands/brand-1/ai/conversations/conv-1', () =>
            HttpResponse.json({ data: conversation() }),
          ),
        ]
      : []),
  )
}

function renderButton() {
  const onOpenContent = vi.fn()
  const onCreated = vi.fn()
  const onUseSuggestion = vi.fn()
  renderRoutes([
    {
      path: '/',
      element: (
        <AiCreateButton
          brandId="brand-1"
          onOpenContent={onOpenContent}
          onUseSuggestion={onUseSuggestion}
          onCreated={onCreated}
        />
      ),
    },
  ])
  const user = userEvent.setup()
  return { onOpenContent, onCreated, onUseSuggestion, user }
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Create with AI/ }))
  return screen.findByRole('dialog')
}

describe('AiCreateButton', () => {
  beforeEach(() => {
    i18n.changeLanguage('en-US')
    window.localStorage.clear()
  })

  it.each([
    ['AI is switched off', { enabled: false }],
    ['this person cannot create posts', { canGenerate: false }],
  ])('stays hidden when %s', async (_, availability) => {
    mockApi(availability)
    renderButton()
    await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument())
  })

  it('starts a new chat, follows the turn and offers the suggestion with its actions', async () => {
    let polls = 0
    mockApi({}, () => {
      polls += 1
      return chat([
        polls < 2 ? turn({ status: 'running', phase: 'writing', suggestion: null }) : turn(),
      ])
    })
    const keys: string[] = []
    let body: unknown
    server.use(
      http.post('*/brands/brand-1/ai/generations', async ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key') ?? '')
        body = await request.json()
        return HttpResponse.json(
          { data: { id: 'gen-1', conversationId: 'conv-1' } },
          { status: 201 },
        )
      }),
    )
    const { user, onUseSuggestion } = renderButton()
    const dialog = await openDialog(user)
    expect(within(dialog).getByText('Hello! 👋')).toBeInTheDocument()
    await user.type(
      within(dialog).getByLabelText('What do you want to post about?'),
      ' New cold brew ',
    )
    // With several Pages and none picked, the Page list is already open in the left column.
    await user.click(await screen.findByRole('checkbox', { name: 'Page A' }))
    await user.click(within(dialog).getByRole('button', { name: /Create post/ }))

    expect(await within(dialog).findByText('Writing the content')).toBeInTheDocument()
    expect(body).toEqual({
      socialAccountIds: ['page-a'],
      brief: { topic: 'New cold brew' },
      autoSubmit: false,
    })
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/)
    // The chat it opened is remembered for next time.
    expect(window.localStorage.getItem(CHAT_KEY)).toBe('conv-1')

    expect(
      await within(dialog).findByText('Cold brew is here', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
    for (const name of ['Publish now', 'Try another idea', 'Edit again'])
      expect(within(dialog).getByRole('button', { name })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Use' }))
    expect(onUseSuggestion).toHaveBeenCalledWith({
      generationId: 'gen-1',
      socialAccountIds: ['page-a'],
      captions: { 'page-a': 'Cold brew is here', 'page-b': 'Cold brew for B' },
      images: [{ id: 'img-1', name: 'ai-1', url: 'https://files.test/ai-1' }],
    })
  }, 10000)

  it('reopens the chat it was on, and a new chat stays new after closing', async () => {
    window.localStorage.setItem(CHAT_KEY, 'conv-1')
    mockApi({}, () => chat([turn()]))
    const { user } = renderButton()
    let dialog = await openDialog(user)
    expect(await within(dialog).findByText('Cold brew is here')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'New chat' }))
    expect(within(dialog).getByText('Hello! 👋')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /close/i }))
    dialog = await openDialog(user)
    expect(within(dialog).getByText('Hello! 👋')).toBeInTheDocument()
    expect(window.localStorage.getItem(CHAT_KEY)).toBeNull()

    // The history in the left column lists the chat and says how long chats are kept.
    expect(
      within(dialog).getByRole('img', {
        name: 'Chats are kept for 30 days after the last message, with their files.',
      }),
    ).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('Search chats'), 'nothing like it')
    expect(within(dialog).getByText('No chats match.')).toBeInTheDocument()
    await user.clear(within(dialog).getByLabelText('Search chats'))
    await user.click(within(dialog).getByRole('button', { name: 'New cold brew' }))
    expect(await within(dialog).findByText('Cold brew is here')).toBeInTheDocument()
  })

  it('publishes after a confirmation, then shows the suggestion as used', async () => {
    window.localStorage.setItem(CHAT_KEY, 'conv-1')
    let posted = false
    mockApi({}, () => chat([turn(posted ? { contentId: 'content-1' } : {})]))
    let intent: unknown
    server.use(
      http.post('*/brands/brand-1/ai/generations/gen-1/post', async ({ request }) => {
        intent = ((await request.json()) as { intent: string }).intent
        posted = true
        return HttpResponse.json({ data: { contentId: 'content-1' } }, { status: 201 })
      }),
    )
    const { user, onCreated, onOpenContent } = renderButton()
    const dialog = await openDialog(user)
    await user.click(await within(dialog).findByRole('button', { name: 'Publish now' }))
    const confirm = (await screen.findByText('Publish this post now?')).closest<HTMLElement>(
      '[role="dialog"]',
    )!
    expect(within(confirm).getByText('It will be published to: Page A.')).toBeInTheDocument()
    await user.click(within(confirm).getByRole('button', { name: 'Publish now' }))
    await waitFor(() => expect(intent).toBe('publish_now'))
    expect(onCreated).toHaveBeenCalled()
    expect(await within(dialog).findByText('Used')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Use' })).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Open post' }))
    expect(onOpenContent).toHaveBeenCalledWith('content-1')
  })

  it('lets someone who needs approval only send the suggestion for approval', async () => {
    window.localStorage.setItem(CHAT_KEY, 'conv-1')
    mockApi({ canPublishDirect: false }, () => chat([turn()]))
    let intent: unknown
    server.use(
      http.post('*/brands/brand-1/ai/generations/gen-1/post', async ({ request }) => {
        intent = ((await request.json()) as { intent: string }).intent
        return HttpResponse.json({ data: { contentId: 'content-1' } }, { status: 201 })
      }),
    )
    const { user } = renderButton()
    const dialog = await openDialog(user)
    await user.click(await within(dialog).findByRole('button', { name: 'Send for approval' }))
    await waitFor(() => expect(intent).toBe('approval_publish_now'))
    expect(within(dialog).queryByRole('button', { name: 'Publish now' })).not.toBeInTheDocument()
  })

  it('shows the avatar of each Page the answer is for', async () => {
    window.localStorage.setItem(CHAT_KEY, 'conv-1')
    const url = 'https://files.test/page-b.png'
    mockApi(
      {
        pages: [
          { id: 'page-a', name: 'Page A' },
          { id: 'page-b', name: 'Page B', avatarUrl: url },
        ],
      },
      () => chat([turn({ socialAccountIds: ['page-a', 'page-b'] })]),
    )
    const { user } = renderButton()
    const dialog = await openDialog(user)
    expect(await within(dialog).findByRole('tab', { name: /Page B/ })).toBeInTheDocument()
    const card = dialog.querySelector<HTMLElement>('[data-turn-card]')!
    expect(card.querySelector(`img[src="${url}"]`)).not.toBeNull()
  })

  it('scrolls to the answer being edited and lights up its card', async () => {
    window.localStorage.setItem(CHAT_KEY, 'conv-1')
    mockApi({}, () => chat([turn()]))
    const scrolled: Element[] = []
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this)
    }
    try {
      const { user } = renderButton()
      const dialog = await openDialog(user)
      await user.click(await within(dialog).findByRole('button', { name: 'Edit again' }))
      await user.click(within(dialog).getByRole('button', { name: 'Editing the suggestion' }))
      expect(scrolled).toEqual([dialog.querySelector('[data-turn-answer="gen-1"]')])
      expect(dialog.querySelector('[data-turn-card]')).toHaveClass('ai-turn-flash')
    } finally {
      Element.prototype.scrollIntoView = original
    }
  })

  it('shows when the answer came, copies its caption and offers another idea as icons', async () => {
    window.localStorage.setItem(CHAT_KEY, 'conv-1')
    mockApi({}, () => chat([turn({ createdAt: new Date().toISOString() })]))
    const { user } = renderButton()
    const dialog = await openDialog(user)
    expect(await within(dialog).findByText('Just now')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Copy caption' }))
    expect(await navigator.clipboard.readText()).toBe('Cold brew is here')
    // The icon answers for a moment; no toast.
    const copied = await within(dialog).findByRole('button', { name: 'Copied' })
    expect(screen.queryByText('Copied')).not.toBeInTheDocument()
    await waitFor(() => expect(copied).toHaveAccessibleName('Copy caption'), { timeout: 3000 })
    expect(within(dialog).getByRole('button', { name: 'Try another idea' })).toBeEnabled()
  })

  it('asks for another idea and edits a suggestion, each as a new turn', async () => {
    window.localStorage.setItem(CHAT_KEY, 'conv-1')
    mockApi({}, () => chat([turn()]))
    const calls: Array<{ path: string; body: unknown }> = []
    server.use(
      http.post('*/brands/brand-1/ai/generations/gen-1/:action', async ({ request, params }) => {
        calls.push({ path: String(params.action), body: await request.json() })
        return HttpResponse.json(
          { data: { id: 'gen-2', conversationId: 'conv-1' } },
          { status: 201 },
        )
      }),
    )
    const { user } = renderButton()
    const dialog = await openDialog(user)
    await user.click(await within(dialog).findByRole('button', { name: 'Try another idea' }))
    await waitFor(() => expect(calls).toEqual([{ path: 'retry', body: {} }]))

    await user.click(within(dialog).getByRole('button', { name: 'Edit again' }))
    expect(within(dialog).getByText('Editing the suggestion')).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('What should change?'), 'Shorter')
    await user.click(within(dialog).getByRole('button', { name: /Create post/ }))
    await waitFor(() =>
      expect(calls[1]).toEqual({ path: 'edit', body: { instruction: 'Shorter' } }),
    )
    expect(within(dialog).queryByText('Editing the suggestion')).not.toBeInTheDocument()
  })

  it('shows a turn sent for approval with a link to its post', async () => {
    window.localStorage.setItem(CHAT_KEY, 'conv-1')
    mockApi({}, () => chat([turn({ autoSubmit: true, contentId: 'content-1', suggestion: null })]))
    const { user, onOpenContent } = renderButton()
    const dialog = await openDialog(user)
    expect(await within(dialog).findByText('Sent for approval')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Open post' }))
    expect(onOpenContent).toHaveBeenCalledWith('content-1')
  })

  it('marks the images the customer sent and names the files the AI could not read', async () => {
    window.localStorage.setItem(CHAT_KEY, 'conv-1')
    const photo = {
      id: 'att-1',
      type: 'image' as const,
      name: 'mon-moi.png',
      url: 'https://files.test/mon-moi.png',
      fromCustomer: true,
    }
    mockApi({}, () =>
      chat([
        turn({
          attachments: [photo],
          imageAction: 'use_attachment',
          suggestion: { captions: { 'page-a': 'Cold brew is here' }, images: [photo] },
          unreadableFiles: ['scan.pdf', 'locked.pdf'],
        }),
      ]),
    )
    const { user } = renderButton()
    const dialog = await openDialog(user)
    const images = await within(dialog).findByRole('list', { name: 'Suggestion images' })
    expect(within(images).getByText('Your image')).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        'Could not read scan.pdf, locked.pdf, so the AI did not use what it says.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the image step only once the AI chooses to make one', async () => {
    window.localStorage.setItem(CHAT_KEY, 'conv-1')
    let current = turn({ status: 'running', phase: 'writing', imageAction: null, suggestion: null })
    mockApi({}, () => chat([current]))
    const { user } = renderButton()
    const dialog = await openDialog(user)
    expect(await within(dialog).findByText('Writing the content')).toBeInTheDocument()
    expect(within(dialog).queryByText('Create the image')).not.toBeInTheDocument()
    current = { ...current, phase: 'image', imageAction: 'generate' }
    expect(
      await within(dialog).findByText('Creating the image', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('turns away old Word and Excel files with how to fix them', async () => {
    mockApi()
    const { user } = renderButton()
    const dialog = await openDialog(user)
    const picker = dialog.querySelector<HTMLInputElement>('input[type="file"]')!
    await user.upload(picker, [new File(['x'], 'menu.doc', { type: 'application/msword' })])
    expect(
      await screen.findByText(
        'Old .doc and .xls files cannot be read. Save them as .docx or .xlsx, then attach them again.',
      ),
    ).toBeInTheDocument()
  })

  it('opens a remembered chat that has expired as a new one', async () => {
    window.localStorage.setItem(CHAT_KEY, 'conv-1')
    mockApi()
    server.use(
      http.get('*/brands/brand-1/ai/conversations/conv-1', () =>
        HttpResponse.json(
          { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'gone' } },
          { status: 404 },
        ),
      ),
    )
    const { user } = renderButton()
    const dialog = await openDialog(user)
    expect(await within(dialog).findByText('Hello! 👋')).toBeInTheDocument()
    await waitFor(() => expect(window.localStorage.getItem(CHAT_KEY)).toBeNull())
  })

  it('sends on Enter, but not on Shift+Enter or while an input method is composing', async () => {
    mockApi()
    const bodies: unknown[] = []
    server.use(
      http.post('*/brands/brand-1/ai/generations', async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(
          { data: { id: 'gen-1', conversationId: 'conv-1' } },
          { status: 201 },
        )
      }),
    )
    const { user } = renderButton()
    const dialog = await openDialog(user)
    const area = within(dialog).getByLabelText<HTMLTextAreaElement>(
      'What do you want to post about?',
    )
    await user.type(area, 'Cold{Shift>}{Enter}{/Shift}brew')
    expect(area.value).toBe('Cold\nbrew')
    fireEvent.keyDown(area, { key: 'Enter', isComposing: true })
    fireEvent.keyDown(area, { key: 'Enter', keyCode: 229 })
    expect(bodies).toEqual([])
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: /Create post/ })).toBeEnabled(),
    )
    await user.type(area, '{Enter}')
    await waitFor(() =>
      expect(bodies).toEqual([
        { socialAccountIds: [], brief: { topic: 'Cold\nbrew' }, autoSubmit: false },
      ]),
    )
  })

  it('keeps the send button off until there is a brief, and needs no Page', async () => {
    mockApi()
    let body: unknown
    server.use(
      http.post('*/brands/brand-1/ai/generations', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(
          { data: { id: 'gen-1', conversationId: 'conv-1' } },
          { status: 201 },
        )
      }),
    )
    const { user } = renderButton()
    const dialog = await openDialog(user)
    const send = within(dialog).getByRole('button', { name: /Create post/ })
    // No brief yet: the button stays off and no message is shown.
    expect(send).toBeDisabled()
    await user.type(within(dialog).getByLabelText('What do you want to post about?'), 'Cold brew')
    await waitFor(() => expect(send).toBeEnabled())
    await user.click(send)
    await waitFor(() =>
      expect(body).toEqual({
        socialAccountIds: [],
        brief: { topic: 'Cold brew' },
        autoSubmit: false,
      }),
    )
  })

  describe('a suggestion made without Pages', () => {
    const general = (): AiGeneration =>
      turn({
        socialAccountIds: [],
        suggestion: { captions: { general: 'Cold brew for all' }, images: [] },
      })

    it('asks which Pages before publishing, and sends those', async () => {
      window.localStorage.setItem(CHAT_KEY, 'conv-1')
      mockApi({}, () => chat([general()]))
      let body: unknown
      server.use(
        http.post('*/brands/brand-1/ai/generations/gen-1/post', async ({ request }) => {
          body = await request.json()
          return HttpResponse.json({ data: { contentId: 'content-1' } }, { status: 201 })
        }),
      )
      const { user } = renderButton()
      const dialog = await openDialog(user)
      expect(await within(dialog).findByText('Cold brew for all')).toBeInTheDocument()
      // No Page yet, so the card names none.
      const card = dialog.querySelector<HTMLElement>('[data-turn-card]')!
      expect(card.querySelector('.text-label-sm')).toBeNull()
      await user.click(within(dialog).getByRole('button', { name: 'Publish now' }))
      const title = await screen.findByText('Pick Pages to post to')
      const popup = title.parentElement!
      const confirmPick = within(popup).getByRole('button', { name: 'Publish now' })
      expect(confirmPick).toBeDisabled()
      await user.click(within(popup).getByRole('checkbox', { name: 'Page B' }))
      await user.click(confirmPick)
      const confirm = (await screen.findByText('Publish this post now?')).closest<HTMLElement>(
        '[role="dialog"]',
      )!
      expect(within(confirm).getByText('It will be published to: Page B.')).toBeInTheDocument()
      await user.click(within(confirm).getByRole('button', { name: 'Publish now' }))
      await waitFor(() =>
        expect(body).toEqual({ intent: 'publish_now', socialAccountIds: ['page-b'] }),
      )
    })

    it('goes to the only Page without asking', async () => {
      window.localStorage.setItem(CHAT_KEY, 'conv-1')
      mockApi({ pages: [{ id: 'page-a', name: 'Page A' }], canPublishDirect: false }, () =>
        chat([general()]),
      )
      let body: unknown
      server.use(
        http.post('*/brands/brand-1/ai/generations/gen-1/post', async ({ request }) => {
          body = await request.json()
          return HttpResponse.json({ data: { contentId: 'content-1' } }, { status: 201 })
        }),
      )
      const { user } = renderButton()
      const dialog = await openDialog(user)
      await user.click(await within(dialog).findByRole('button', { name: 'Send for approval' }))
      await waitFor(() =>
        expect(body).toEqual({ intent: 'approval_publish_now', socialAccountIds: ['page-a'] }),
      )
      expect(screen.queryByText('Pick Pages to post to')).not.toBeInTheDocument()
    })

    it('hands the post screen one caption and lets it ask for the Pages', async () => {
      window.localStorage.setItem(CHAT_KEY, 'conv-1')
      mockApi({}, () => chat([general()]))
      const { user, onUseSuggestion } = renderButton()
      const dialog = await openDialog(user)
      await user.click(await within(dialog).findByRole('button', { name: 'Use' }))
      expect(onUseSuggestion).toHaveBeenCalledWith({
        generationId: 'gen-1',
        socialAccountIds: [],
        captions: {},
        generalCaption: 'Cold brew for all',
        images: [],
      })
    })
  })

  it('explains a failed turn in the customer’s words, with no code and no button to send it again', async () => {
    mockApi({}, () =>
      chat([turn({ status: 'failed', errorCode: 'AI_DISABLED', suggestion: null })]),
    )
    server.use(
      http.post('*/brands/brand-1/ai/generations', () =>
        HttpResponse.json({ data: { id: 'gen-1', conversationId: 'conv-1' } }),
      ),
    )
    const { user } = renderButton()
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText('What do you want to post about?'), 'Sale')
    await user.click(await screen.findByRole('checkbox', { name: 'Page A' }))
    await user.click(within(dialog).getByRole('button', { name: /Create post/ }))
    expect(
      await within(dialog).findByText('AI generation is turned off right now.'),
    ).toBeInTheDocument()
    expect(within(dialog).queryByText(/AI_DISABLED/)).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('explains when the API turns a request away, as with no AI agent set up', async () => {
    mockApi()
    server.use(
      http.post('*/brands/brand-1/ai/generations', () =>
        HttpResponse.json(
          { error: { code: 'AI_AGENT_NOT_CONFIGURED', message: 'not set up', fields: [] } },
          { status: 409 },
        ),
      ),
    )
    const { user } = renderButton()
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText('What do you want to post about?'), 'Sale')
    await user.click(await screen.findByRole('checkbox', { name: 'Page A' }))
    await user.click(within(dialog).getByRole('button', { name: /Create post/ }))
    expect(await within(dialog).findByText('AI is not set up yet.')).toBeInTheDocument()
    expect(within(dialog).queryByText(/AI_AGENT_NOT_CONFIGURED/)).not.toBeInTheDocument()
  })

  describe('first-run screen', () => {
    const onboardingApi = (state: string, suggestion: unknown = null) =>
      http.get('*/brands/brand-1/ai/onboarding', () =>
        HttpResponse.json({ data: { state, suggestion } }),
      )
    const SUGGESTION = {
      industry: 'Coffee',
      products: null,
      targetAudience: null,
      tonePreset: 'friendly',
      toneNotes: null,
      preferredWords: ['bold'],
      ideas: ['Idea 1', 'Idea 2', 'Idea 3'],
    }

    it('proposes a profile, then starts the samples and opens their chat', async () => {
      let confirmed: { topics?: string[]; socialAccountId?: string; industry?: string } = {}
      let reads = 0
      mockApi({ needsOnboarding: true }, () => chat([turn({ usedBestPosts: true })]))
      server.use(
        onboardingApi('ready'),
        http.post('*/brands/brand-1/ai/onboarding/suggest', () => {
          reads += 1
          return HttpResponse.json({ data: SUGGESTION })
        }),
        http.post('*/brands/brand-1/ai/onboarding/confirm', async ({ request }) => {
          confirmed = (await request.json()) as typeof confirmed
          return HttpResponse.json({ data: { conversationId: 'conv-1' } })
        }),
      )
      const { user } = renderButton()
      const dialog = await openDialog(user)
      expect(await within(dialog).findByText('Let AI get to know your Brand')).toBeInTheDocument()
      // Reading the posts is paid and sends them to the AI, so it waits for the press.
      expect(reads).toBe(0)
      await user.click(within(dialog).getByRole('button', { name: 'Read my posts' }))
      expect(await within(dialog).findByDisplayValue('Coffee')).toBeInTheDocument()
      await user.click(
        within(dialog).getByRole('button', { name: 'Confirm and create 3 suggestions' }),
      )
      expect(
        await within(dialog).findByText('Written in the style of your best-performing posts.'),
      ).toBeInTheDocument()
      expect(confirmed).toMatchObject({
        industry: 'Coffee',
        socialAccountId: 'page-a',
        topics: ['Idea 1', 'Idea 2', 'Idea 3'],
      })
    })

    it('skips to the chat and tells the API, so it does not come back', async () => {
      let skipped = false
      mockApi({ needsOnboarding: true })
      server.use(
        onboardingApi('ready'),
        http.post('*/brands/brand-1/ai/onboarding/skip', () => {
          skipped = true
          return new HttpResponse(null, { status: 204 })
        }),
      )
      const { user } = renderButton()
      const dialog = await openDialog(user)
      await user.click(await within(dialog).findByRole('button', { name: 'Skip' }))
      expect(
        await within(dialog).findByLabelText('What do you want to post about?'),
      ).toBeInTheDocument()
      expect(skipped).toBe(true)
    })

    it('waits while the Page syncs, with a way to fill the profile in now', async () => {
      mockApi({ needsOnboarding: true })
      server.use(onboardingApi('syncing'))
      const { user } = renderButton()
      const dialog = await openDialog(user)
      expect(await within(dialog).findByText("Getting your Page's older posts")).toBeInTheDocument()
      await user.click(within(dialog).getByRole('button', { name: 'Fill in the profile myself' }))
      expect(await within(dialog).findByText('Tell AI about your Brand')).toBeInTheDocument()
    })

    it('asks for the profile on a Page with too few posts, and uses general topics', async () => {
      let topics: string[] = []
      mockApi({ needsOnboarding: true }, () => chat([turn()]))
      server.use(
        onboardingApi('few_posts'),
        http.post('*/brands/brand-1/ai/onboarding/confirm', async ({ request }) => {
          topics = ((await request.json()) as { topics: string[] }).topics
          return HttpResponse.json({ data: { conversationId: 'conv-1' } })
        }),
      )
      const { user } = renderButton()
      const dialog = await openDialog(user)
      await user.click(
        await within(dialog).findByRole('button', { name: 'Confirm and create 3 suggestions' }),
      )
      await waitFor(() =>
        expect(topics).toEqual([
          'Introduce our brand',
          'Introduce a standout product or service',
          'Share a useful tip for customers',
        ]),
      )
    })
  })

  it('uses the only Page without asking, and folds the left column to icons', async () => {
    mockApi({ pages: [{ id: 'page-a', name: 'Page A' }] })
    let body: { socialAccountIds?: string[] } = {}
    server.use(
      http.post('*/brands/brand-1/ai/generations', async ({ request }) => {
        body = (await request.json()) as typeof body
        return HttpResponse.json({ data: { id: 'gen-1', conversationId: 'conv-1' } })
      }),
    )
    const { user } = renderButton()
    const dialog = await openDialog(user)
    expect(screen.queryByRole('checkbox', { name: 'Page A' })).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Collapse' }))
    expect(within(dialog).queryByLabelText('Search chats')).not.toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('What do you want to post about?'), 'Sale')
    await user.click(within(dialog).getByRole('button', { name: /Create post/ }))
    await waitFor(() => expect(body.socialAccountIds).toEqual(['page-a']))
    await user.click(within(dialog).getByRole('button', { name: 'Expand' }))
    expect(within(dialog).getByLabelText('Search chats')).toBeInTheDocument()
  })

  it('guides a first-time user through three steps in place of the empty history', async () => {
    mockApi({ hasProfile: false })
    server.use(http.get('*/brands/brand-1/ai/conversations', () => HttpResponse.json({ data: [] })))
    const { user } = renderButton()
    const dialog = await openDialog(user)
    const steps = await within(dialog).findByRole('region', { name: 'Get started' })
    expect(within(dialog).queryByLabelText('Search chats')).not.toBeInTheDocument()
    expect(within(steps).queryByText('(done)')).not.toBeInTheDocument()

    // Picking a Page ticks the second step.
    await user.click(await screen.findByRole('checkbox', { name: 'Page A' }))
    expect(
      within(steps).getByRole('button', { name: /Choose Pages to post to.*done/ }),
    ).toBeInTheDocument()

    await user.click(within(steps).getByRole('button', { name: /Send your first request/ }))
    expect(within(dialog).getByLabelText('What do you want to post about?')).toHaveFocus()
  })

  it('invites setting up the Brand profile when there is none', async () => {
    mockApi({ hasProfile: false })
    const { user } = renderButton()
    const dialog = await openDialog(user)
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
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText('What do you want to post about?'), 'Cold brew')
    await user.click(await screen.findByRole('checkbox', { name: 'Page A' }))
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

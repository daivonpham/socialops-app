import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
  type KeyboardEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { isApiErrorCode } from '@/shared/api/errors'
import { useAuth } from '@/shared/auth'
import { PHONE_QUERY, useApiErrorMessage, useMediaQuery } from '@/shared/hooks'
import { formatDate } from '@/shared/i18n'
import {
  Alert,
  ConfirmDialog,
  Form,
  IconAttach,
  IconClose,
  IconCompose,
  IconEdit,
  IconPanelLeftOpen,
  IconSendLine,
  IconSendSolid,
  Input,
  Modal,
  SectionError,
  Spin,
  Textarea,
  useToast,
} from '@/shared/ui'
import {
  AI_GENERAL_CAPTION_KEY,
  useAiConversation,
  useAiTemplates,
  useFollowUpAiGeneration,
  useRefreshAiAvailability,
  usePostAiSuggestion,
  useStartAiGeneration,
  type AiAvailability,
  type AiGeneration,
  type AiPlatform,
  type AiPostIntent,
  type AiSuggestionHandoff,
  type AiTemplateOption,
} from '../api'
import {
  readChosenPages,
  readOpenChat,
  rememberChosenPages,
  rememberOpenChat,
} from '../model/chatMemory'
import { AiSidebar } from './AiSidebar'
import { AiChatTurn, type AiTurnActions } from './AiChatTurn'
import { AiMark } from './AiMark'
import assistantBackground from '@/assets/ai/assistant-background.svg'
import assistantRobot from '@/assets/ai/assistant-robot.svg'
import { AiCreditsEmpty } from './AiCreditsEmpty'
import { AiOnboarding } from './AiOnboarding'
import { BrandAiProfileModal } from './BrandAiProfileModal'
import {
  AttachButton,
  AttachmentList,
  filesFromClipboard,
  useAttachments,
} from './ComposerAttachments'

const FREEFORM = ''
/** The request typed in the composer; templates add their own fields beside it. */
const TOPIC_KEY = 'topic'

type Values = {
  pageIds: string[]
  brief: Record<string, string>
  autoSubmit: boolean
}

const newKey = (): string => crypto.randomUUID()
/** A little longer than the animation of this class in index.css. */
const FLASH_CLASS = 'ai-turn-flash'
const FLASH_MS = 1800
const soleOf = (pages: AiAvailability['pages']): string[] =>
  pages.length === 1 ? [pages[0]!.id] : []
const initialPageOf = (
  pages: AiAvailability['pages'],
  defaultPageId: string | undefined,
): AiAvailability['pages'][number] | undefined =>
  pages.length === 1 ? pages[0] : pages.find((page) => page.id === defaultPageId)
const unfinished = (turn: AiGeneration): boolean =>
  turn.status === 'queued' || turn.status === 'running'

/**
 * Two panels like a chat assistant: on the left the chats, Pages, options and Brand profile, which
 * folds to icons; on the right the open chat and the composer the request is typed into. Each request
 * is a turn; without "Send for approval" it ends as a suggestion with its own actions.
 */
export function AiCreateModal({
  brandId,
  platform,
  availability,
  defaultPageId,
  onOpenContent,
  onUseSuggestion,
  onCreated,
  onClose,
}: {
  brandId: string
  /** The network the post is for: only its accounts are offered. */
  platform: AiPlatform
  availability: AiAvailability
  defaultPageId?: string
  onOpenContent: (contentId: string, platform: AiPlatform) => void
  onUseSuggestion: (suggestion: AiSuggestionHandoff) => void
  onCreated: () => void
  onClose: () => void
}) {
  const { t, i18n } = useTranslation('aiContent')
  const errorMessage = useApiErrorMessage('aiContent')
  const toast = useToast()
  const { user } = useAuth()
  const refreshCredits = useRefreshAiAvailability(brandId)
  const templates = useAiTemplates(brandId)
  const start = useStartAiGeneration()
  const followUp = useFollowUpAiGeneration()
  const post = usePostAiSuggestion()
  const [form] = Form.useForm<Values>()
  const [templateKey, setTemplateKey] = useState(FREEFORM)
  const [requestKey, setRequestKey] = useState(newKey)
  const [profileOpen, setProfileOpen] = useState(false)
  // Answered in this sitting; availability catches up behind it.
  const [onboarded, setOnboarded] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  // A phone shows the chat; the column of chats, Pages and options opens over it on demand.
  const phone = useMediaQuery(PHONE_QUERY)
  const [phoneSidebarOpen, setPhoneSidebarOpen] = useState(false)
  const [conversationId, setConversationId] = useState(() => readOpenChat(user?.id, brandId))
  const [editing, setEditing] = useState<AiGeneration | null>(null)
  // A request sent while a file is still uploading goes out as soon as the uploads finish.
  const [queued, setQueued] = useState(false)
  const [publishing, setPublishing] = useState<{ turn: AiGeneration; pageIds: string[] } | null>(
    null,
  )
  const chat = useAiConversation(brandId, conversationId)
  const attachments = useAttachments(brandId)
  const list = useRef<HTMLDivElement>(null)
  const flashTimer = useRef<number | undefined>(undefined)
  const composer = useRef<HTMLDivElement>(null)
  const statuses = useRef(new Map<string, AiGeneration['status']>())
  const pages = useMemo(
    () => availability.pages.filter((page) => page.platform === platform),
    [availability.pages, platform],
  )
  // The first-run profile reads a Facebook Page's posts, so it needs one.
  const onboardingPage =
    (platform === 'facebook' ? initialPageOf(pages, defaultPageId) : undefined) ??
    availability.pages.find((page) => page.platform === 'facebook')
  const turns = chat.data?.turns ?? []
  const working = turns.some(unfinished)
  const template = templates.data?.find((item) => item.key === templateKey)
  const extraFields = (template?.briefFields ?? []).filter((field) => field.key !== TOPIC_KEY)
  // With a template's own fields to fill, the composer only adds detail.
  const topicRequired = extraFields.length === 0 || editing !== null
  // One Page is simply used; otherwise the Page Planning is filtered to, or none yet.
  const initialPage = initialPageOf(pages, defaultPageId)
  // Without either, the Pages chosen last time, of those still usable.
  const [rememberedPages] = useState(() =>
    readChosenPages(user?.id, brandId).filter((id) => pages.some((page) => page.id === id)),
  )
  // No error messages here: the send button stays off until the request is complete.
  const watchedPages = Form.useWatch('pageIds', form)
  const watchedBrief = Form.useWatch('brief', form)
  const filled = (key: string) => Boolean(watchedBrief?.[key]?.trim())
  const ready = editing
    ? filled(TOPIC_KEY)
    : (!topicRequired || filled(TOPIC_KEY)) &&
      extraFields.every((field) => !field.required || filled(field.key))
  const sending = start.isPending || followUp.isPending
  const sendError = start.error ?? followUp.error
  const creditsGone = isApiErrorCode(sendError, 'AI_MEMBER_QUOTA_EXCEEDED')
    ? 'member'
    : isApiErrorCode(sendError, 'AI_QUOTA_EXCEEDED')
      ? 'workspace'
      : null

  // A failed upload stops the queued request, so the customer sees it and can retry or remove it.
  useEffect(() => {
    if (!queued || attachments.uploading) return
    setQueued(false)
    if (!attachments.failed) form.submit()
  }, [queued, attachments.uploading, attachments.failed, form])

  // Sending for approval needs Pages, so taking the last one away turns it off.
  useEffect(() => {
    if (watchedPages?.length === 0 && form.getFieldValue('autoSubmit'))
      form.setFieldValue('autoSubmit', false)
  }, [watchedPages, form])

  useEffect(() => {
    if (watchedPages) rememberChosenPages(user?.id, brandId, watchedPages)
  }, [watchedPages, user?.id, brandId])

  // Reopening lands where the dialog was closed (D14).
  useEffect(
    () => rememberOpenChat(user?.id, brandId, conversationId),
    [user?.id, brandId, conversationId],
  )

  // A remembered chat that has since expired opens as a new one.
  useEffect(() => {
    if (chat.isError && isApiErrorCode(chat.error, 'RESOURCE_NOT_FOUND')) setConversationId(null)
  }, [chat.isError, chat.error])

  // A turn sent for approval made a post: Planning shows it from now on.
  useEffect(() => {
    let created = false
    let finished = false
    for (const turn of turns) {
      const before = statuses.current.get(turn.id)
      if (before && before !== 'succeeded' && turn.status === 'succeeded' && turn.contentId)
        created = true
      if (before && before !== turn.status && !unfinished(turn)) finished = true
      statuses.current.set(turn.id, turn.status)
    }
    if (created) onCreated()
    if (finished) refreshCredits()
  }, [turns, onCreated, refreshCredits])

  // The newest turn stays in view.
  const lastTurn = turns.at(-1)
  useEffect(() => {
    const element = list.current
    if (element) element.scrollTop = element.scrollHeight
  }, [turns.length, lastTurn?.status, conversationId])

  // The answer being edited may have scrolled away; its start is what the edit is about.
  const showEditing = () => {
    if (!editing) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const answer = list.current?.querySelector(`[data-turn-answer="${editing.id}"]`)
    answer?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
    const card = answer?.querySelector<HTMLElement>('[data-turn-card]')
    if (!card) return
    // Dropped and measured first, so a second click plays it again.
    window.clearTimeout(flashTimer.current)
    card.classList.remove(FLASH_CLASS)
    void card.offsetWidth
    card.classList.add(FLASH_CLASS)
    flashTimer.current = window.setTimeout(() => card.classList.remove(FLASH_CLASS), FLASH_MS)
  }

  const afterSend = (nextConversationId: string) => {
    setConversationId(nextConversationId)
    refreshCredits()
    setRequestKey(newKey())
    setEditing(null)
    setTemplateKey(FREEFORM)
    form.setFieldValue('brief', {})
  }

  const submit = async (values: Values) => {
    if (!ready || sending || working) return
    if (attachments.uploading) {
      setQueued(true)
      return
    }
    const text = values.brief?.[TOPIC_KEY]?.trim() ?? ''
    let started: { conversationId: string }
    try {
      if (editing) {
        started = await followUp.mutateAsync({
          brandId,
          generationId: editing.id,
          idempotencyKey: requestKey,
          instruction: text,
        })
      } else {
        started = await start.mutateAsync({
          brandId,
          idempotencyKey: requestKey,
          socialAccountIds: values.pageIds,
          platform,
          ...(templateKey ? { templateKey } : {}),
          brief: Object.fromEntries(
            [TOPIC_KEY, ...extraFields.map((field) => field.key)].map((key) => [
              key,
              values.brief?.[key]?.trim() ?? '',
            ]),
          ),
          autoSubmit: platform === 'facebook' && values.autoSubmit,
          ...(conversationId ? { conversationId } : {}),
          ...(attachments.readyIds.length ? { attachmentIds: attachments.readyIds } : {}),
        })
        attachments.consume()
      }
    } catch {
      // A failed request may still have been received: keep the key, so a retry cannot start two.
      return
    }
    afterSend(started.conversationId)
  }

  // Enter sends and Shift+Enter starts a new line. An Enter that confirms what an input method
  // is composing belongs to it (keyCode 229 is how Safari reports the last one).
  const sendOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    form.submit()
  }

  // A pasted file or screenshot is attached like a picked one; pasted text stays plain text.
  // While editing a sent message there is nothing to attach to, so the paste is left alone.
  const attachOnPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (editing !== null) return
    const files = filesFromClipboard(event.clipboardData)
    if (!files.length) return
    event.preventDefault()
    attachments.add(files)
  }

  // Files dragged onto the composer are attached the same way. Children fire their own enter and
  // leave, so a count tells when the drag has really left the box.
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)
  const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes('Files')
  const endDrag = () => {
    dragDepth.current = 0
    setDragging(false)
  }
  const dropTarget = {
    onDragEnter: (event: DragEvent<HTMLDivElement>) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      dragDepth.current += 1
      setDragging(true)
    },
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = editing === null ? 'copy' : 'none'
    },
    onDragLeave: (event: DragEvent<HTMLDivElement>) => {
      if (!carriesFiles(event)) return
      dragDepth.current -= 1
      if (dragDepth.current <= 0) endDrag()
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      endDrag()
      // Nothing to attach to while a sent message is being edited.
      if (editing === null) attachments.add(filesFromClipboard(event.dataTransfer))
    },
  }
  // A file dropped beside the composer would make the browser open it and leave the app.
  const keepDropsInApp = (event: DragEvent<HTMLElement>) => {
    if (carriesFiles(event)) event.preventDefault()
  }

  const resetErrors = () => {
    if (start.isError) start.reset()
    if (followUp.isError) followUp.reset()
  }

  const actions: AiTurnActions = {
    onUse: (turn) => {
      const captions = turn.suggestion?.captions ?? {}
      const general = turn.socialAccountIds.length ? undefined : captions[AI_GENERAL_CAPTION_KEY]
      // Made without Pages: one Page is simply used, and with several the post screen asks. An
      // earlier turn of the chat may be for the other network.
      const ids =
        general === undefined
          ? turn.socialAccountIds
          : soleOf(availability.pages.filter((page) => page.platform === turn.platform))
      onUseSuggestion({
        generationId: turn.id,
        platform: turn.platform,
        socialAccountIds: ids,
        captions:
          general === undefined ? captions : Object.fromEntries(ids.map((id) => [id, general])),
        ...(general === undefined ? {} : { generalCaption: general }),
        images: (turn.suggestion?.images ?? []).map(({ id, url, name }) => ({ id, url, name })),
      })
    },
    onPost: (turn, intent, pageIds) => {
      if (intent === 'publish_now') setPublishing({ turn, pageIds })
      else void send(turn, intent, pageIds)
    },
    onAnotherIdea: (turn) => {
      resetErrors()
      void followUp
        .mutateAsync({ brandId, generationId: turn.id, idempotencyKey: newKey() })
        .then((started) => setConversationId(started.conversationId))
        .catch(() => undefined)
    },
    onEdit: (turn) => {
      setEditing(turn)
      setRequestKey(newKey())
      form.setFieldValue(['brief', TOPIC_KEY], '')
    },
    // Like a new request typed in the composer, with the Pages and options chosen now, but with
    // the request's own template, other fields and files.
    onResend: async (turn, text, key) => {
      if (sending || working) return false
      resetErrors()
      const values = form.getFieldsValue(true) as Values
      try {
        const started = await start.mutateAsync({
          brandId,
          idempotencyKey: key,
          socialAccountIds: values.pageIds,
          platform,
          ...(turn.templateKey ? { templateKey: turn.templateKey } : {}),
          brief: { ...turn.brief, [TOPIC_KEY]: text },
          autoSubmit: platform === 'facebook' && values.autoSubmit,
          ...(conversationId ? { conversationId } : {}),
          ...(turn.attachments.length
            ? { attachmentIds: turn.attachments.map((file) => file.id) }
            : {}),
        })
        setConversationId(started.conversationId)
        refreshCredits()
        return true
      } catch {
        // The error shows above the composer; the same key keeps a retry from sending it twice.
        return false
      }
    },
    onOpenContent,
  }

  const send = async (turn: AiGeneration, intent: AiPostIntent, pageIds: string[]) => {
    try {
      await post.mutateAsync({
        brandId,
        generationId: turn.id,
        intent,
        ...(turn.socialAccountIds.length ? {} : { socialAccountIds: pageIds }),
      })
    } catch (error) {
      toast.error({
        title: errorMessage(error, t('chat.postError')),
      })
      return
    } finally {
      setPublishing(null)
    }
    toast.success({ title: t(intent === 'publish_now' ? 'chat.published' : 'chat.submitted') })
    onCreated()
  }

  const hero = (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
      <img src={assistantRobot} alt="" aria-hidden className="h-auto w-[240px]" />
      <h3 className="mt-4 text-heading-2 text-text-primary">{t('hero.title')}</h3>
      <p className="mt-1 text-body-md text-text-secondary">{t('hero.subtitle')}</p>
      <GoalChips
        templates={templates.data}
        loading={templates.isPending}
        selected={templateKey}
        onSelect={setTemplateKey}
      />
      {template?.description ? (
        <p className="mt-3 text-body-sm text-text-tertiary">{template.description}</p>
      ) : null}
      {extraFields.length ? (
        <div className="mt-6 grid w-full max-w-xl gap-x-4 text-start sm:grid-cols-2">
          {extraFields.map((field) => (
            <Form.Item
              key={`${templateKey}-${field.key}`}
              name={['brief', field.key]}
              label={field.label}
            >
              <Input maxLength={2000} placeholder={field.placeholder} />
            </Form.Item>
          ))}
        </div>
      ) : null}
    </div>
  )

  const body =
    conversationId && chat.isPending ? (
      <div className="flex flex-1 items-center justify-center">
        <Spin size="lg" />
      </div>
    ) : conversationId && chat.isError ? (
      <div className="p-6">
        <SectionError
          title={t('history.chatLoadError')}
          retryLabel={t('progress.tryAgain')}
          onRetry={() => void chat.refetch()}
        />
      </div>
    ) : turns.length ? (
      // The top padding keeps the first message clear of the dialog's close button.
      <ul
        className="grid content-start gap-6 px-4 pt-4 pb-6 md:px-6 md:pt-12"
        aria-label={t('chat.list')}
      >
        {turns.map((turn) => (
          <AiChatTurn
            key={turn.id}
            brandId={brandId}
            turn={turn}
            pages={pages}
            templates={templates.data}
            canPublishDirect={availability.canPublishDirect}
            busy={sending || working || post.isPending}
            editing={editing?.id === turn.id}
            actions={actions}
          />
        ))}
      </ul>
    ) : (
      hero
    )

  return (
    <>
      <Modal
        open
        title={null}
        width={1040}
        fullScreenOnPhone
        padding="none"
        floatingClose
        onClose={onClose}
        footer={null}
      >
        {pages.length === 0 ? (
          <div className="p-8">
            <Alert
              variant="soft"
              tone="info"
              title={t('form.noPages')}
              description={t(
                availability.canManageChannels ? 'form.noPagesAdmin' : 'form.noPagesMember',
              )}
            />
          </div>
        ) : availability.needsOnboarding && !onboarded && onboardingPage ? (
          <AiOnboarding
            brandId={brandId}
            pageId={onboardingPage.id}
            onFinished={(startedChat) => {
              setOnboarded(true)
              if (startedChat) setConversationId(startedChat)
            }}
          />
        ) : (
          <Form<Values>
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{
              pageIds: initialPage ? [initialPage.id] : rememberedPages,
              brief: {},
              autoSubmit: false,
            }}
            onValuesChange={resetErrors}
            // Every value, including switches in a menu that was never opened.
            onFinish={() => void submit(form.getFieldsValue(true) as Values)}
          >
            <div
              className={
                'relative flex h-[100dvh] flex-col overflow-hidden md:grid md:h-[min(720px,calc(100vh-120px))] md:rounded-2xl ' +
                (collapsed
                  ? 'md:grid-cols-[72px_minmax(0,1fr)]'
                  : 'md:grid-cols-[288px_minmax(0,1fr)]')
              }
            >
              <AiSidebar
                brandId={brandId}
                platform={platform}
                pages={pages}
                hasProfile={availability.hasProfile}
                historyDays={availability.historyDays}
                credits={availability}
                currentId={conversationId}
                collapsed={phone ? false : collapsed}
                phoneOpen={phoneSidebarOpen}
                background={assistantBackground}
                onToggle={() =>
                  phone ? setPhoneSidebarOpen(false) : setCollapsed((value) => !value)
                }
                onPick={(id) => {
                  setEditing(null)
                  setConversationId(id)
                  setPhoneSidebarOpen(false)
                }}
                onNew={() => {
                  setEditing(null)
                  setConversationId(null)
                  setPhoneSidebarOpen(false)
                }}
                onDeleted={(id) => {
                  if (id !== conversationId) return
                  setEditing(null)
                  setConversationId(null)
                }}
                onOpenProfile={() => setProfileOpen(true)}
                onStartTyping={() => composer.current?.querySelector('textarea')?.focus()}
              />
              <section
                className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-surface-subtle"
                onDragOver={keepDropsInApp}
                onDrop={keepDropsInApp}
              >
                {/* A phone's bar: the chats, the title and a new chat; the dialog's close
                    button takes the corner. */}
                {phone ? (
                  <div className="flex shrink-0 items-center gap-1 border-b border-ai-100 bg-ai-50 py-2 ps-2 pe-[56px] md:hidden">
                    <button
                      type="button"
                      aria-label={t('sidebar.expand')}
                      onClick={() => setPhoneSidebarOpen(true)}
                      className="flex size-10 items-center justify-center rounded-lg text-icon-md text-text-secondary hover:bg-bg-surface focus-visible:focus-ring"
                    >
                      <IconPanelLeftOpen aria-hidden />
                    </button>
                    <h2 className="flex min-w-0 flex-1 items-center gap-2 text-heading-4 text-text-primary">
                      <AiMark className="w-[24px] shrink-0" />
                      <span className="truncate">{t('modal.title')}</span>
                    </h2>
                    <button
                      type="button"
                      aria-label={t('history.new')}
                      onClick={() => {
                        setEditing(null)
                        setConversationId(null)
                      }}
                      className="flex size-10 items-center justify-center rounded-lg text-icon-md text-text-secondary hover:bg-bg-surface focus-visible:focus-ring"
                    >
                      <IconCompose aria-hidden />
                    </button>
                  </div>
                ) : null}
                <div
                  ref={list}
                  className="app-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto"
                >
                  {body}
                </div>

                <div ref={composer} className="px-3 pt-2 pb-3 md:px-6 md:pb-5">
                  {sendError ? (
                    <div className="mb-3">
                      {creditsGone ? (
                        <AiCreditsEmpty
                          whose={creditsGone}
                          resetDate={formatDate(availability.creditsResetAt, i18n.language)}
                        />
                      ) : (
                        <Alert
                          variant="soft"
                          tone="error"
                          title={errorMessage(sendError, t('form.startError'))}
                        />
                      )}
                    </div>
                  ) : null}
                  <div
                    {...dropTarget}
                    className="relative rounded-xl border border-border-subtle bg-bg-surface px-4 pt-3 pb-2 shadow-xs transition-colors focus-within:border-ai-400"
                  >
                    {dragging && editing === null ? (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ai-400 bg-ai-50/95 text-label-md text-ai-700"
                      >
                        <IconAttach className="text-icon-md" />
                        {t('attach.dropHere')}
                      </div>
                    ) : null}
                    {editing ? (
                      <div className="mb-2 flex items-center gap-2 rounded-lg bg-ai-50 px-3 py-1 text-label-sm text-ai-700">
                        <button
                          type="button"
                          title={t('chat.showEditing')}
                          onClick={showEditing}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm text-start hover:underline focus-visible:focus-ring"
                        >
                          <IconEdit aria-hidden className="shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{t('chat.editing')}</span>
                        </button>
                        <button
                          type="button"
                          aria-label={t('chat.cancelEdit')}
                          onClick={() => setEditing(null)}
                          className="flex size-5 items-center justify-center rounded-full hover:bg-ai-100 focus-visible:focus-ring"
                        >
                          <IconClose aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <AttachmentList
                        items={attachments.items}
                        onRemove={attachments.remove}
                        onRetry={attachments.retry}
                      />
                    )}
                    <Form.Item
                      name={['brief', TOPIC_KEY]}
                      className="!mb-0 [&_textarea]:!resize-none [&_textarea]:!border-0 [&_textarea]:!p-0 [&_textarea]:!shadow-none"
                    >
                      <Textarea
                        className="app-scrollbar"
                        autoSize={{ minRows: 2, maxRows: 6 }}
                        maxLength={2000}
                        onKeyDown={sendOnEnter}
                        onPaste={attachOnPaste}
                        aria-label={t(editing ? 'chat.editLabel' : 'form.topic')}
                        placeholder={
                          editing
                            ? t('chat.editPlaceholder')
                            : topicRequired
                              ? t('form.topicPlaceholder')
                              : t('form.detailPlaceholder')
                        }
                      />
                    </Form.Item>
                    <div className="mt-2 flex items-center justify-between">
                      <AttachButton
                        disabled={attachments.full || editing !== null}
                        onPick={attachments.add}
                      />
                      <SendButton
                        label={t('form.submit')}
                        loading={sending || queued}
                        disabled={!ready || working}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </Form>
        )}
      </Modal>
      {profileOpen ? (
        <BrandAiProfileModal brandId={brandId} onClose={() => setProfileOpen(false)} />
      ) : null}
      <ConfirmDialog
        open={publishing !== null}
        tone="primary"
        icon={<IconSendLine aria-hidden className="text-ai-600" />}
        title={t('chat.confirmPublishTitle')}
        description={t('chat.confirmPublishDescription', {
          pages: (publishing?.pageIds ?? [])
            .map((id) => pages.find((page) => page.id === id)?.name ?? t('chat.unknownPage'))
            .join(', '),
        })}
        confirmLabel={t('chat.publishNow')}
        cancelLabel={t('modal.cancel')}
        loading={post.isPending}
        onConfirm={() => {
          if (publishing) void send(publishing.turn, 'publish_now', publishing.pageIds)
        }}
        onClose={() => setPublishing(null)}
      />
    </>
  )
}

function SendButton({
  label,
  loading,
  disabled,
}: {
  label: string
  loading: boolean
  disabled: boolean
}) {
  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      disabled={loading || disabled}
      className="flex size-[36px] shrink-0 items-center justify-center rounded-lg bg-action-primary text-icon-md text-text-inverse transition-colors hover:bg-action-primary-hover focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-action-primary"
    >
      {loading ? (
        <Spin size="sm" indicator="ring" className="text-text-inverse" />
      ) : (
        <IconSendSolid aria-hidden />
      )}
    </button>
  )
}

function GoalChips({
  templates,
  loading,
  selected,
  onSelect,
}: {
  templates: AiTemplateOption[] | undefined
  loading: boolean
  selected: string
  onSelect: (key: string) => void
}) {
  const { t } = useTranslation('aiContent')
  if (loading)
    return (
      <div className="mt-6">
        <Spin />
      </div>
    )
  if (!templates?.length) return null
  const chip = (key: string, label: ReactNode) => (
    <button
      key={key || 'freeform'}
      type="button"
      aria-pressed={selected === key}
      onClick={() => onSelect(key)}
      className={
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-label-md shadow-xs transition-colors focus-visible:focus-ring ' +
        (selected === key
          ? 'border-ai-400 bg-ai-50 text-ai-700'
          : 'border-ai-100 bg-bg-surface text-text-secondary hover:border-ai-300 hover:text-text-primary')
      }
    >
      <AiMark className="w-[16px]" />
      {label}
    </button>
  )
  return (
    <div
      className="mt-6 flex flex-wrap justify-center gap-2"
      role="group"
      aria-label={t('form.goal')}
    >
      {chip(FREEFORM, t('form.freeform'))}
      {templates.map((item) => chip(item.key, item.name))}
    </div>
  )
}

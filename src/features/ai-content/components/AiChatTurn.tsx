import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CodedError } from '@/shared/api/errors'
import { useApiErrorMessage } from '@/shared/hooks'
import { openFile } from '@/shared/lib/openFile'
import {
  Alert,
  Avatar,
  Button,
  IconCheck,
  IconCheckSolid,
  IconCopy,
  IconEdit,
  IconFileText,
  IconOpen,
  IconRefresh,
  IconSendLine,
  Popover,
  Image,
  ImagePreviewGroup,
  MarkdownText,
  Tabs,
  Textarea,
  useToast,
} from '@/shared/ui'
import {
  AI_GENERAL_CAPTION_KEY,
  type AiAvailability,
  type AiGeneration,
  type AiPartialSuggestion,
  type AiPostIntent,
  type AiLiveText,
  type AiTemplateOption,
  useAiLiveText,
} from '../api'
import { AiGenerationProgress, AiWorking } from './AiGenerationProgress'
import { turnDuration } from '../model/turnTime'
import { PageCheckList } from './PageCheckList'

export type AiTurnActions = {
  /** "Use": opens the post screen filled with the suggestion. */
  onUse: (turn: AiGeneration) => void
  /** `pageIds`: where it goes, the turn's own Pages unless it was made without any. */
  onPost: (turn: AiGeneration, intent: AiPostIntent, pageIds: string[]) => void
  onAnotherIdea: (turn: AiGeneration) => void
  onEdit: (turn: AiGeneration) => void
  /**
   * The request sent again as a new one, with new words and the same files. `key` stays the same
   * for a retry of the same edit. Resolves true once it is sent.
   */
  onResend: (turn: AiGeneration, text: string, key: string) => Promise<boolean>
  onOpenContent: (contentId: string) => void
}

/** What the person asked, as it reads in the chat. */
function requestText(
  turn: AiGeneration,
  templates: AiTemplateOption[] | undefined,
  anotherIdea: string,
): string {
  if (turn.kind === 'retry') return anotherIdea
  if (turn.kind === 'edit') return turn.brief.instruction ?? ''
  const fields = templates?.find((item) => item.key === turn.templateKey)?.briefFields ?? []
  return Object.entries(turn.brief)
    .map(([key, value]) => {
      const label = fields.find((field) => field.key === key && key !== 'topic')?.label
      return label ? `${label}: ${value}` : value
    })
    .join('\n')
}

/** How long the copy icon shows its check. */
const COPIED_MS = 1500

/** A copy button whose icon turns to a check for a moment once the text is copied. */
function useCopy(errorKey: 'chat.copyError' | 'chat.copyRequestError') {
  const { t } = useTranslation('aiContent')
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      toast.error({ title: t(errorKey) })
      return
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), COPIED_MS)
  }
  return { copied, copy }
}

/**
 * The words of a request changed in place. Sending asks again as a new request, with the same
 * files; Escape or "Cancel" leaves it as it was.
 */
function RequestEditor({
  initial,
  busy,
  onCancel,
  onSend,
}: {
  initial: string
  busy: boolean
  onCancel: () => void
  onSend: (text: string) => Promise<void>
}) {
  const { t } = useTranslation('aiContent')
  const [text, setText] = useState(initial)
  const [sending, setSending] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => box.current?.querySelector('textarea')?.focus(), [])
  const ready = Boolean(text.trim()) && !busy && !sending

  const send = async () => {
    if (!ready) return
    setSending(true)
    try {
      await onSend(text.trim())
    } finally {
      setSending(false)
    }
  }

  // Enter sends and Shift+Enter starts a new line, as in the composer.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
      return
    }
    if (event.key !== 'Enter' || event.shiftKey) return
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    void send()
  }

  return (
    <div ref={box} className="w-full rounded-xl border border-ai-300 bg-bg-surface px-4 pt-3 pb-3 shadow-xs">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          const end = event.currentTarget.value.length
          event.currentTarget.setSelectionRange(end, end)
        }}
        autoSize={{ minRows: 1, maxRows: 8 }}
        maxLength={2000}
        aria-label={t('chat.editRequestLabel')}
        className="app-scrollbar !resize-none !border-0 !p-0 !shadow-none"
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" disabled={sending} onClick={onCancel}>
          {t('modal.cancel')}
        </Button>
        <Button
          size="sm"
          variant="primary"
          loading={sending}
          disabled={!ready}
          onClick={() => void send()}
        >
          {t('chat.resend')}
        </Button>
      </div>
    </div>
  )
}

function UserMessage({
  turn,
  templates,
  busy,
  onResend,
}: {
  turn: AiGeneration
  templates: AiTemplateOption[] | undefined
  busy: boolean
  onResend: AiTurnActions['onResend']
}) {
  const { t } = useTranslation('aiContent')
  const template = templates?.find((item) => item.key === turn.templateKey)
  const text = requestText(turn, templates, t('chat.anotherIdea'))
  const { copied, copy } = useCopy('chat.copyRequestError')
  // Set while the words are being changed; one key per edit, so a retry cannot send it twice.
  const [editKey, setEditKey] = useState<string | null>(null)
  // "Try another idea" and "Edit again" ask about an answer, so only a fresh request is asked again.
  const editable = turn.kind === 'new'

  return (
    <div className="group flex flex-col items-end gap-2">
      {turn.attachments.length ? (
        <ImagePreviewGroup>
          <ul className="flex flex-wrap justify-end gap-2" aria-label={t('attach.list')}>
            {turn.attachments.map((file) => (
              <li key={file.id}>
                {file.type === 'image' ? (
                  <Image
                    src={file.url}
                    alt={file.name}
                    wrapperClassName="!block size-[56px] overflow-hidden rounded-lg border border-border-subtle [&_.ant-image-mask]:!hidden"
                    className="!size-full cursor-pointer object-cover"
                  />
                ) : (
                  <button
                    type="button"
                    title={file.name}
                    aria-label={t('attach.open', { name: file.name })}
                    onClick={() => openFile({ url: file.url, name: file.name })}
                    className="flex h-[56px] max-w-[200px] items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface px-3 text-body-sm text-text-secondary hover:border-ai-300 focus-visible:focus-ring"
                  >
                    <IconFileText aria-hidden className="shrink-0 text-icon-md text-ai-500" />
                    <span className="truncate">{file.name}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </ImagePreviewGroup>
      ) : null}
      {editKey ? (
        <RequestEditor
          initial={turn.brief.topic ?? ''}
          busy={busy}
          onCancel={() => setEditKey(null)}
          onSend={async (next) => {
            if (await onResend(turn, next, editKey)) setEditKey(null)
          }}
        />
      ) : (
        <>
          <div className="max-w-[80%] rounded-xl rounded-ee-sm bg-ai-100 px-4 py-3 text-body-sm whitespace-pre-wrap text-text-primary">
            {template ? (
              <span className="mb-1 block text-label-sm text-ai-700">{template.name}</span>
            ) : null}
            {text}
          </div>
          {/* Shown on hover; always there for keyboards and touch screens. */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
            <IconAction
              label={t(copied ? 'chat.copied' : 'chat.copyRequest')}
              onClick={() => void copy(text)}
            >
              {copied ? <IconCheckSolid /> : <IconCopy />}
            </IconAction>
            {editable ? (
              <IconAction
                label={t('chat.editRequest')}
                disabled={busy}
                onClick={() => setEditKey(crypto.randomUUID())}
              >
                <IconEdit />
              </IconAction>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

function ActionButton({
  icon,
  children,
  primary = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode
  children: ReactNode
  primary?: boolean
  disabled?: boolean
  /** Left out when a Popover around the button handles the click. */
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        'inline-flex h-[32px] items-center gap-2 rounded-lg px-3 text-label-md transition-colors focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50 ' +
        (primary
          ? 'bg-linear-to-br from-ai-400 to-ai-600 text-text-inverse shadow-xs hover:brightness-110'
          : 'border border-border-subtle bg-bg-surface text-text-secondary hover:border-ai-300 hover:text-ai-700')
      }
    >
      <span aria-hidden className="text-icon-sm">
        {icon}
      </span>
      {children}
    </button>
  )
}

/** A small icon button, named for screen readers. */
function IconAction({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-6 items-center justify-center rounded-md text-icon-sm text-text-tertiary transition-colors hover:bg-bg-surface-muted hover:text-text-secondary focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}

/**
 * "Worked for 2m 22s" above the answer. While the AI works it counts up each second from when
 * the request was sent; nothing shows on finished turns from before the end time was kept.
 */
function WorkedFor({ turn }: { turn: AiGeneration }) {
  const { t, i18n } = useTranslation('aiContent')
  const unfinished = turn.status === 'queued' || turn.status === 'running'
  const now = useSecondTick(unfinished)
  // A clock a little behind the server's still reads as a second, not as nothing.
  const end = unfinished
    ? new Date(Math.max(now, Date.parse(turn.createdAt))).toISOString()
    : turn.finishedAt
  const duration = turnDuration(turn.createdAt, end, i18n.resolvedLanguage ?? 'vi-VN')
  if (!duration) return null
  return (
    <p className="border-b border-border-subtle pb-3 text-body-sm text-text-tertiary">
      {t('chat.workedFor', { duration })}
    </p>
  )
}

/** The time now, renewed each second while `active`. */
function useSecondTick(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [active])
  return now
}

/**
 * "Publish now" or "Send for approval". A suggestion made without Pages goes to the only Page
 * there is, or asks which ones first.
 */
function PostButton({
  turn,
  pages,
  canPublishDirect,
  busy,
  onPost,
}: {
  turn: AiGeneration
  pages: AiAvailability['pages']
  canPublishDirect: boolean
  busy: boolean
  onPost: AiTurnActions['onPost']
}) {
  const { t } = useTranslation('aiContent')
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const intent: AiPostIntent = canPublishDirect ? 'publish_now' : 'approval_publish_now'
  const label = t(canPublishDirect ? 'chat.publishNow' : 'chat.submit')

  if (turn.socialAccountIds.length || pages.length <= 1) {
    const pageIds = turn.socialAccountIds.length
      ? turn.socialAccountIds
      : pages.map((page) => page.id)
    return (
      <ActionButton
        icon={<IconSendLine />}
        disabled={busy}
        onClick={() => onPost(turn, intent, pageIds)}
      >
        {label}
      </ActionButton>
    )
  }

  return (
    <Popover
      placement="bottomLeft"
      open={open}
      onOpenChange={(next) => setOpen(next && !busy)}
      content={
        <div className="grid w-[288px] gap-2 p-2">
          <p className="px-2 pt-1 text-label-md text-text-primary">{t('chat.pickPages')}</p>
          <PageCheckList
            pages={pages}
            value={picked}
            onChange={setPicked}
            hoverClassName="hover:bg-bg-surface-muted"
          />
          <div className="flex justify-end">
            <ActionButton
              primary
              icon={<IconSendLine />}
              disabled={busy || picked.length === 0}
              onClick={() => {
                setOpen(false)
                onPost(turn, intent, picked)
              }}
            >
              {label}
            </ActionButton>
          </div>
        </div>
      }
    >
      <span className="inline-flex rounded-lg">
        <ActionButton icon={<IconSendLine />} disabled={busy}>
          {label}
        </ActionButton>
      </span>
    </Popover>
  )
}

function SuggestionCard({
  turn,
  pages,
  canPublishDirect,
  busy,
  editing,
  actions,
}: {
  turn: AiGeneration
  pages: AiAvailability['pages']
  canPublishDirect: boolean
  busy: boolean
  editing: boolean
  actions: AiTurnActions
}) {
  const { t } = useTranslation('aiContent')
  const { copied, copy } = useCopy('chat.copyError')
  const suggestion = turn.suggestion!
  const ids = turn.socialAccountIds
  const [pageId, setPageId] = useState(ids[0] ?? AI_GENERAL_CAPTION_KEY)
  const nameOf = (id: string) => pages.find((page) => page.id === id)?.name ?? t('chat.unknownPage')
  const pageTag = (id: string) => (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span aria-hidden className="inline-flex shrink-0">
        <Avatar
          name={nameOf(id)}
          src={pages.find((page) => page.id === id)?.avatarUrl}
          size="xs"
          fallbackClassName="text-caption"
        />
      </span>
      <span className="truncate">{nameOf(id)}</span>
    </span>
  )
  const used = turn.contentId
  const caption = suggestion.captions[pageId] ?? ''

  return (
    <div className="grid gap-4">
      <div data-turn-card className="grid gap-3 rounded-xl">
        {ids.length > 1 ? (
          <Tabs
            variant="line"
            value={pageId}
            ariaLabel={t('chat.pagesLabel')}
            options={ids.map((id) => ({ value: id, label: pageTag(id) }))}
            onChange={setPageId}
          />
        ) : ids.length ? (
          <span className="text-label-sm text-text-tertiary">{pageTag(pageId)}</span>
        ) : null}
        <MarkdownText className="text-body-sm text-text-primary">{caption}</MarkdownText>
        {suggestion.images.length ? (
          <ImagePreviewGroup>
            <ul className="flex flex-wrap gap-2" aria-label={t('chat.images')}>
              {suggestion.images.map((image) => (
                <li key={image.id} className="relative">
                  <Image
                    src={image.url}
                    alt={image.name}
                    wrapperClassName="!block size-[120px] overflow-hidden rounded-lg border border-border-subtle"
                    className="!size-full cursor-pointer object-cover"
                  />
                  {/* The AI may post images the customer sent; marked, they are not taken for its own. */}
                  {image.fromCustomer ? (
                    <span className="pointer-events-none absolute start-2 bottom-2 rounded-full bg-bg-surface/90 px-2 py-0.5 text-label-sm text-text-secondary shadow-xs">
                      {t('chat.yourImage')}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </ImagePreviewGroup>
        ) : null}
        {turn.imageErrorCode ? (
          <p className="text-body-sm text-warning-700">{t('chat.imageMissing')}</p>
        ) : null}
        {turn.missingImages ? (
          <p className="text-body-sm text-warning-700">
            {t('chat.imagesMissing', { count: turn.missingImages })}
          </p>
        ) : null}
        {turn.usedBestPosts ? (
          <p className="text-body-sm text-text-secondary">{t('chat.basedOnBestPosts')}</p>
        ) : null}
        {turn.unreadableFiles.length ? (
          <p className="text-body-sm text-warning-700">
            {t('chat.unreadable', { names: turn.unreadableFiles.join(', ') })}
          </p>
        ) : null}
      </div>
      {/* The actions on the left, copy and another idea at the far right. */}
      <div className="flex flex-wrap items-center gap-2">
        {used ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-3 py-1 text-label-sm text-success-700">
              <IconCheck aria-hidden />
              {t('chat.used')}
            </span>
            <ActionButton icon={<IconOpen />} onClick={() => actions.onOpenContent(used)}>
              {t('progress.open')}
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton primary icon={<IconCheck />} onClick={() => actions.onUse(turn)}>
              {t('chat.use')}
            </ActionButton>
            <PostButton
              turn={turn}
              pages={pages}
              canPublishDirect={canPublishDirect}
              busy={busy}
              onPost={actions.onPost}
            />
            <ActionButton
              icon={<IconEdit />}
              disabled={busy || editing}
              onClick={() => actions.onEdit(turn)}
            >
              {t('chat.edit')}
            </ActionButton>
          </>
        )}
        <div className="ms-auto flex items-center gap-2">
          <IconAction label={t(copied ? 'chat.copied' : 'chat.copy')} onClick={() => void copy(caption)}>
            {copied ? <IconCheckSolid /> : <IconCopy />}
          </IconAction>
          {used ? null : (
            <>
              <span aria-hidden className="h-3 w-px bg-border-subtle" />
              <IconAction
                label={t('chat.anotherIdea')}
                disabled={busy}
                onClick={() => actions.onAnotherIdea(turn)}
              >
                <IconRefresh />
              </IconAction>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** The images ready so far. Those still being made show only in the step line. */
function PartialImages({ partial }: { partial: AiPartialSuggestion }) {
  const { t } = useTranslation('aiContent')
  if (!partial.images.length) return null
  return (
    <ul className="flex flex-wrap gap-2" aria-label={t('chat.images')}>
      {partial.images.map((image) => (
        <li key={image.id}>
          <Image
            src={image.url}
            alt={image.name}
            wrapperClassName="!block size-[120px] overflow-hidden rounded-lg border border-border-subtle"
            className="!size-full cursor-pointer object-cover"
          />
        </li>
      ))}
    </ul>
  )
}

/**
 * A suggestion whose words are ready and whose images are not. It has no actions yet: what would
 * be posted is not settled until the images are.
 */
function PartialSuggestion({
  turn,
  partial,
  captions,
  pages,
}: {
  turn: AiGeneration
  partial: AiPartialSuggestion
  captions: Record<string, string>
  pages: AiAvailability['pages']
}) {
  const { t } = useTranslation('aiContent')
  const ids = turn.socialAccountIds.length ? turn.socialAccountIds : [AI_GENERAL_CAPTION_KEY]
  const nameOf = (id: string) => pages.find((page) => page.id === id)?.name ?? t('chat.unknownPage')
  return (
    <div className="grid gap-3">
      {ids.map((id) => (
        <div key={id} className="grid gap-1">
          {ids.length > 1 ? (
            <span className="text-label-sm text-text-tertiary">{nameOf(id)}</span>
          ) : null}
          <MarkdownText className="text-body-sm text-text-primary">
            {captions[id] ?? ''}
          </MarkdownText>
        </div>
      ))}
      <PartialImages partial={partial} />
      <AiWorking
        label={t(partial.pendingImages ? 'progress.running.image' : 'progress.running.finishing')}
      />
    </div>
  )
}

/**
 * The AI's words as it writes them. Not final: the checks may still take them back, so there are
 * no actions yet, only what it is doing now.
 */
function LiveText({
  turn,
  live,
  pages,
}: {
  turn: AiGeneration
  live: AiLiveText
  pages: AiAvailability['pages']
}) {
  const { t } = useTranslation('aiContent')
  if (live.kind === 'reply')
    return (
      <MarkdownText streaming className="text-body-sm text-text-primary">
        {live.text}
      </MarkdownText>
    )
  const ids = Object.keys(live.captions)
  const nameOf = (id: string) => pages.find((page) => page.id === id)?.name ?? t('chat.unknownPage')
  const step = turn.phase === 'checking' ? 'checking' : turn.kind === 'edit' ? 'editing' : 'writing'
  return (
    <div className="grid gap-3">
      {ids.map((id, index) => (
        <div key={id} className="grid gap-1">
          {ids.length > 1 ? (
            <span className="text-label-sm text-text-tertiary">{nameOf(id)}</span>
          ) : null}
          <MarkdownText
            streaming={index === ids.length - 1}
            className="text-body-sm text-text-primary"
          >
            {live.captions[id] ?? ''}
          </MarkdownText>
        </div>
      ))}
      {turn.partial ? <PartialImages partial={turn.partial} /> : null}
      <AiWorking label={t(`progress.running.${step}`)} />
    </div>
  )
}

function AssistantMessage({
  brandId,
  turn,
  pages,
  canPublishDirect,
  busy,
  editing,
  actions,
}: {
  brandId: string
  turn: AiGeneration
  pages: AiAvailability['pages']
  canPublishDirect: boolean
  busy: boolean
  editing: boolean
  actions: AiTurnActions
}) {
  const { t } = useTranslation('aiContent')
  const errorMessage = useApiErrorMessage('aiContent')
  const unfinished = turn.status === 'queued' || turn.status === 'running'
  // "Send for approval" shows no suggestion on the way, and checked captions replace the stream.
  const live = useAiLiveText(
    brandId,
    turn.id,
    unfinished && !turn.autoSubmit && !turn.partial?.captions,
  )

  let body: ReactNode
  if (unfinished && turn.partial?.captions)
    body = (
      <PartialSuggestion
        turn={turn}
        partial={turn.partial}
        captions={turn.partial.captions}
        pages={pages}
      />
    )
  else if (unfinished && live) body = <LiveText turn={turn} live={live} pages={pages} />
  else if (unfinished)
    body = (
      <div className="grid gap-3">
        <AiGenerationProgress turn={turn} />
        {turn.partial ? <PartialImages partial={turn.partial} /> : null}
      </div>
    )
  else if (turn.status === 'failed')
    body = (
      <div>
        <Alert
          variant="pill"
          tone="error"
          title={errorMessage(new CodedError(turn.errorCode ?? 'UNKNOWN'), t('progress.failed'))}
        />
      </div>
    )
  else if (turn.reply)
    body = <MarkdownText className="text-body-sm text-text-primary">{turn.reply}</MarkdownText>
  else if (turn.autoSubmit && turn.contentId) {
    const contentId = turn.contentId
    body = (
      <div className="grid gap-3">
        <div className="flex items-start gap-3 rounded-xl border border-success-500 bg-success-50 p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-500 text-text-inverse">
            <IconCheck aria-hidden />
          </span>
          <div>
            <p className="text-label-md text-text-primary">{t('chat.submittedTitle')}</p>
            <p className="text-body-sm text-text-secondary">{t('progress.submittedDescription')}</p>
          </div>
        </div>
        {turn.imageErrorCode ? (
          <p className="text-body-sm text-warning-700">{t('progress.imageMissing')}</p>
        ) : null}
        {turn.missingImages ? (
          <p className="text-body-sm text-warning-700">
            {t('chat.imagesMissing', { count: turn.missingImages })}
          </p>
        ) : null}
        <div>
          <ActionButton icon={<IconOpen />} onClick={() => actions.onOpenContent(contentId)}>
            {t('progress.open')}
          </ActionButton>
        </div>
      </div>
    )
  } else if (turn.suggestion)
    body = (
      <SuggestionCard
        turn={turn}
        pages={pages}
        canPublishDirect={canPublishDirect}
        busy={busy}
        editing={editing}
        actions={actions}
      />
    )
  else body = <p className="text-body-sm text-text-secondary">{t('progress.failed')}</p>

  return (
    <div data-turn-answer={turn.id} className="grid min-w-0 scroll-mt-12 gap-4">
      <WorkedFor turn={turn} />
      {body}
    </div>
  )
}

/** One turn of the chat: the request on the right, the answer on the left. */
export function AiChatTurn({
  brandId,
  turn,
  pages,
  templates,
  canPublishDirect,
  busy,
  editing,
  actions,
}: {
  brandId: string
  turn: AiGeneration
  pages: AiAvailability['pages']
  templates: AiTemplateOption[] | undefined
  canPublishDirect: boolean
  /** An action is under way; the buttons wait for it. */
  busy: boolean
  /** The composer is editing this turn. */
  editing: boolean
  actions: AiTurnActions
}) {
  return (
    <li className="grid gap-8">
      <UserMessage
        turn={turn}
        templates={templates}
        busy={busy}
        onResend={actions.onResend}
      />
      <AssistantMessage
        brandId={brandId}
        turn={turn}
        pages={pages}
        canPublishDirect={canPublishDirect}
        busy={busy}
        editing={editing}
        actions={actions}
      />
    </li>
  )
}

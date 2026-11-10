import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CodedError } from '@/shared/api/errors'
import { useApiErrorMessage } from '@/shared/hooks'
import { openFile } from '@/shared/lib/openFile'
import {
  Alert,
  Avatar,
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
  Tabs,
  useToast,
} from '@/shared/ui'
import {
  AI_GENERAL_CAPTION_KEY,
  type AiAvailability,
  type AiGeneration,
  type AiPostIntent,
  type AiTemplateOption,
} from '../api'
import { AiGenerationProgress } from './AiGenerationProgress'
import { turnTimeAgo } from '../model/turnTime'
import { AiMark } from './AiMark'
import { PageCheckList } from './PageCheckList'

export type AiTurnActions = {
  /** "Use": opens the post screen filled with the suggestion. */
  onUse: (turn: AiGeneration) => void
  /** `pageIds`: where it goes, the turn's own Pages unless it was made without any. */
  onPost: (turn: AiGeneration, intent: AiPostIntent, pageIds: string[]) => void
  onAnotherIdea: (turn: AiGeneration) => void
  onEdit: (turn: AiGeneration) => void
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

function UserMessage({
  turn,
  templates,
}: {
  turn: AiGeneration
  templates: AiTemplateOption[] | undefined
}) {
  const { t } = useTranslation('aiContent')
  const template = templates?.find((item) => item.key === turn.templateKey)
  return (
    <div className="flex flex-col items-end gap-2">
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
      <div className="max-w-[80%] rounded-xl rounded-ee-sm bg-ai-100 px-4 py-3 text-body-sm whitespace-pre-wrap text-text-primary">
        {template ? (
          <span className="mb-1 block text-label-sm text-ai-700">{template.name}</span>
        ) : null}
        {requestText(turn, templates, t('chat.anotherIdea'))}
      </div>
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

/** How long the copy icon shows its check. */
const COPIED_MS = 1500

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
      className="flex size-6 items-center justify-center rounded-md text-icon-sm text-text-primary transition-colors hover:bg-ai-50 hover:text-ai-700 focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}

/** How long ago the turn was made, kept current while the chat stays open. */
function TurnTime({ createdAt }: { createdAt: string }) {
  const { t, i18n } = useTranslation('aiContent')
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <time dateTime={createdAt} className="text-caption text-text-secondary">
      {turnTimeAgo(createdAt, now, i18n.resolvedLanguage ?? 'vi-VN') ?? t('chat.justNow')}
    </time>
  )
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
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(copiedTimer.current), [])
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(caption)
    } catch {
      toast.error({ title: t('chat.copyError') })
      return
    }
    setCopied(true)
    window.clearTimeout(copiedTimer.current)
    copiedTimer.current = window.setTimeout(() => setCopied(false), COPIED_MS)
  }

  return (
    <div className="grid gap-3">
      <div
        data-turn-card
        className="grid gap-3 rounded-xl border border-border-subtle bg-bg-surface p-3 shadow-xs"
      >
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
        <p className="text-body-sm whitespace-pre-wrap text-text-primary">{caption}</p>
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
        {turn.usedBestPosts ? (
          <p className="text-body-sm text-text-secondary">{t('chat.basedOnBestPosts')}</p>
        ) : null}
        {turn.unreadableFiles.length ? (
          <p className="text-body-sm text-warning-700">
            {t('chat.unreadable', { names: turn.unreadableFiles.join(', ') })}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <TurnTime createdAt={turn.createdAt} />
          <div className="flex items-center gap-2">
            <IconAction label={t(copied ? 'chat.copied' : 'chat.copy')} onClick={() => void copy()}>
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
      {used ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-3 py-1 text-label-sm text-success-700">
            <IconCheck aria-hidden />
            {t('chat.used')}
          </span>
          <ActionButton icon={<IconOpen />} onClick={() => actions.onOpenContent(used)}>
            {t('progress.open')}
          </ActionButton>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
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
        </div>
      )}
    </div>
  )
}

function AssistantMessage({
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
  const errorMessage = useApiErrorMessage('aiContent')

  let body: ReactNode
  if (turn.status === 'queued' || turn.status === 'running')
    body = <AiGenerationProgress turn={turn} />
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
    <div data-turn-answer={turn.id} className="flex scroll-mt-12 items-start gap-3">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-ai-100 bg-ai-50"
      >
        <AiMark className="w-[20px]" />
      </span>
      <div className="min-w-0 flex-1">{body}</div>
    </div>
  )
}

/** One turn of the chat: the request on the right, the answer on the left. */
export function AiChatTurn({
  turn,
  pages,
  templates,
  canPublishDirect,
  busy,
  editing,
  actions,
}: {
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
    <li className="grid gap-4">
      <UserMessage turn={turn} templates={templates} />
      <AssistantMessage
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

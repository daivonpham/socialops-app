import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CodedError } from '@/shared/api/errors'
import { useApiErrorMessage } from '@/shared/hooks'
import { openFile } from '@/shared/lib/openFile'
import {
  Alert,
  IconCheck,
  IconEdit,
  IconFileText,
  IconOpen,
  IconRefresh,
  IconSendLine,
  Image,
  ImagePreviewGroup,
  Tabs,
} from '@/shared/ui'
import type { AiAvailability, AiGeneration, AiPostIntent, AiTemplateOption } from '../api'
import { AiGenerationProgress } from './AiGenerationProgress'
import { AiMark } from './AiMark'

export type AiTurnActions = {
  /** "Use": opens the post screen filled with the suggestion. */
  onUse: (turn: AiGeneration) => void
  onPost: (turn: AiGeneration, intent: AiPostIntent) => void
  onAnotherIdea: (turn: AiGeneration) => void
  onEdit: (turn: AiGeneration) => void
  /** Sends a failed request again. */
  onResend: (turn: AiGeneration) => void
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
  onClick: () => void
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
  const suggestion = turn.suggestion!
  const ids = turn.socialAccountIds
  const [pageId, setPageId] = useState(ids[0] ?? '')
  const nameOf = (id: string) => pages.find((page) => page.id === id)?.name ?? t('chat.unknownPage')
  const used = turn.contentId

  return (
    <div className="grid gap-3">
      <p className="text-body-sm text-text-secondary">{t('chat.suggestionIntro')}</p>
      <div className="grid gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-xs">
        {ids.length > 1 ? (
          <Tabs
            variant="line"
            value={pageId}
            ariaLabel={t('chat.pagesLabel')}
            options={ids.map((id) => ({ value: id, label: nameOf(id) }))}
            onChange={setPageId}
          />
        ) : (
          <span className="text-label-sm text-text-tertiary">{nameOf(pageId)}</span>
        )}
        <p className="text-body-sm whitespace-pre-wrap text-text-primary">
          {suggestion.captions[pageId] ?? ''}
        </p>
        {suggestion.images.length ? (
          <ImagePreviewGroup>
            <ul className="flex flex-wrap gap-2" aria-label={t('chat.images')}>
              {suggestion.images.map((image) => (
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
          </ImagePreviewGroup>
        ) : null}
        {turn.imageErrorCode ? (
          <p className="text-body-sm text-warning-700">{t('chat.imageMissing')}</p>
        ) : null}
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
          <ActionButton
            icon={<IconSendLine />}
            disabled={busy}
            onClick={() =>
              actions.onPost(turn, canPublishDirect ? 'publish_now' : 'approval_publish_now')
            }
          >
            {t(canPublishDirect ? 'chat.publishNow' : 'chat.submit')}
          </ActionButton>
          <ActionButton
            icon={<IconRefresh />}
            disabled={busy}
            onClick={() => actions.onAnotherIdea(turn)}
          >
            {t('chat.anotherIdea')}
          </ActionButton>
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
      <div className="grid gap-3">
        <Alert
          variant="soft"
          tone="error"
          title={t('progress.failedTitle')}
          description={errorMessage(
            new CodedError(turn.errorCode ?? 'UNKNOWN'),
            t('progress.failed'),
          )}
        />
        {turn.kind === 'new' ? (
          <div>
            <ActionButton
              icon={<IconRefresh />}
              disabled={busy}
              onClick={() => actions.onResend(turn)}
            >
              {t('progress.tryAgain')}
            </ActionButton>
          </div>
        ) : null}
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
    <div className="flex items-start gap-3">
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

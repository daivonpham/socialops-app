import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useApiErrorMessage } from '@/shared/hooks'
import {
  Alert,
  Avatar,
  Form,
  IconCheck,
  IconChevronRight,
  IconImageLine,
  IconLayers,
  IconSendLine,
  IconSend,
  Input,
  Modal,
  SectionLabel,
  Spin,
  Switch,
  Textarea,
} from '@/shared/ui'
import {
  useAiTemplates,
  useStartAiGeneration,
  type AiAvailability,
  type AiTemplateOption,
} from '../api'
import { AiGenerationProgress } from './AiGenerationProgress'
import { AiMark } from './AiMark'
import assistantBackground from '@/assets/ai/assistant-background.svg'
import assistantRobot from '@/assets/ai/assistant-robot.svg'
import { BrandAiProfileModal } from './BrandAiProfileModal'
import { AttachButton, AttachmentList, useAttachments } from './ComposerAttachments'

const FREEFORM = ''
/** The request typed in the composer; templates add their own fields beside it. */
const TOPIC_KEY = 'topic'

type Values = {
  pageIds: string[]
  brief: Record<string, string>
  wantsImage: boolean
  autoSubmit: boolean
}

const newKey = (): string => crypto.randomUUID()

/**
 * Two panels like a chat assistant: settings on the left (Pages, options, Brand profile), and on
 * the right a greeting, goal chips and the composer the request is typed into.
 */
export function AiCreateModal({
  brandId,
  availability,
  defaultPageId,
  onOpenContent,
  onCreated,
  onClose,
}: {
  brandId: string
  availability: AiAvailability
  defaultPageId?: string
  onOpenContent: (contentId: string) => void
  onCreated: () => void
  onClose: () => void
}) {
  const { t } = useTranslation('aiContent')
  const errorMessage = useApiErrorMessage('aiContent')
  const templates = useAiTemplates(brandId)
  const start = useStartAiGeneration()
  const [form] = Form.useForm<Values>()
  const [templateKey, setTemplateKey] = useState(FREEFORM)
  const [requestKey, setRequestKey] = useState(newKey)
  const [generation, setGeneration] = useState<{ id: string; autoSubmit: boolean } | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const attachments = useAttachments(brandId)
  const { pages } = availability
  const template = templates.data?.find((item) => item.key === templateKey)
  const extraFields = (template?.briefFields ?? []).filter((field) => field.key !== TOPIC_KEY)
  // With a template's own fields to fill, the composer only adds detail.
  const topicRequired = extraFields.length === 0
  const firstPage = pages.find((page) => page.id === defaultPageId) ?? pages[0]
  // No error messages here: the send button stays off until the request is complete.
  const watchedPages = Form.useWatch('pageIds', form)
  const watchedBrief = Form.useWatch('brief', form)
  const filled = (key: string) => Boolean(watchedBrief?.[key]?.trim())
  const ready =
    (watchedPages?.length ?? 0) > 0 &&
    (!topicRequired || filled(TOPIC_KEY)) &&
    extraFields.every((field) => !field.required || filled(field.key))

  const submit = async (values: Values) => {
    if (!ready || attachments.uploading) return
    let started: { id: string }
    try {
      started = await start.mutateAsync({
        brandId,
        idempotencyKey: requestKey,
        socialAccountIds: values.pageIds,
        ...(templateKey ? { templateKey } : {}),
        brief: Object.fromEntries(
          [TOPIC_KEY, ...extraFields.map((field) => field.key)].map((key) => [
            key,
            values.brief?.[key]?.trim() ?? '',
          ]),
        ),
        wantsImage: values.wantsImage,
        autoSubmit: values.autoSubmit,
      })
    } catch {
      // A failed request may still have been received: keep the key, so a retry cannot start two.
      return
    }
    attachments.keep()
    setGeneration({ id: started.id, autoSubmit: values.autoSubmit })
  }

  const retry = () => {
    setGeneration(null)
    setRequestKey(newKey())
    start.reset()
  }

  const settings = (
    <aside
      className="flex flex-col gap-6 border-b border-ai-100 bg-ai-50 bg-cover bg-right-bottom p-6 md:border-e md:border-b-0"
      // Quoted: a small SVG is inlined as a data URL that may hold spaces.
      style={{ backgroundImage: `url("${assistantBackground}")` }}
    >
      <div>
        <h2 className="flex items-center gap-2 text-heading-3 text-text-primary">
          <AiMark className="w-[32px]" />
          {t('modal.title')}
        </h2>
        <p className="mt-2 text-body-sm text-text-secondary">{t('modal.description')}</p>
      </div>

      <div>
        <SectionLabel className="mb-2 block">{t('form.pages')}</SectionLabel>
        <Form.Item name="pageIds" className="!mb-0">
          <PagePicker pages={pages} />
        </Form.Item>
      </div>

      <div>
        <SectionLabel className="mb-2 block">{t('form.options')}</SectionLabel>
        <div className="grid gap-3">
          <OptionSwitch name="wantsImage" icon={<IconImageLine />} label={t('form.image')} />
          <OptionSwitch name="autoSubmit" icon={<IconSendLine />} label={t('form.autoSubmit')} />
        </div>
      </div>

      <ProfileCard hasProfile={availability.hasProfile} onOpen={() => setProfileOpen(true)} />
    </aside>
  )

  return (
    <>
      <Modal open title={null} width={1040} padding="none" onClose={onClose} footer={null}>
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
        ) : (
          <Form<Values>
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{
              pageIds: firstPage ? [firstPage.id] : [],
              brief: {},
              wantsImage: false,
              autoSubmit: false,
            }}
            onValuesChange={() => {
              if (start.isError) start.reset()
            }}
            onFinish={(values) => void submit(values)}
          >
            <div className="grid min-h-[560px] md:grid-cols-[288px_minmax(0,1fr)]">
              {settings}
              <section className="flex min-w-0 flex-col">
                {generation ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
                    <img src={assistantRobot} alt="" aria-hidden className="h-auto w-[152px]" />
                    <div className="mt-2 w-full max-w-md">
                      <AiGenerationProgress
                        brandId={brandId}
                        generationId={generation.id}
                        autoSubmit={generation.autoSubmit}
                        onOpen={(contentId) => {
                          onCreated()
                          onOpenContent(contentId)
                        }}
                        onRetry={retry}
                        onClose={() => {
                          onCreated()
                          onClose()
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-1 flex-col items-center justify-center px-8 pt-10 pb-6 text-center">
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
                        <p className="mt-3 text-body-sm text-text-tertiary">
                          {template.description}
                        </p>
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

                    <div className="border-t border-border-subtle bg-bg-surface-subtle px-6 py-4">
                      {start.isError ? (
                        <div className="mb-3">
                          <Alert
                            variant="soft"
                            tone="error"
                            title={errorMessage(start.error, t('form.startError'))}
                          />
                        </div>
                      ) : null}
                      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 pt-3 pb-2 shadow-xs transition-colors focus-within:border-ai-400">
                        <AttachmentList
                          items={attachments.items}
                          onRemove={attachments.remove}
                          onRetry={attachments.retry}
                        />
                        <Form.Item
                          name={['brief', TOPIC_KEY]}
                          className="!mb-0 [&_textarea]:!resize-none [&_textarea]:!border-0 [&_textarea]:!p-0 [&_textarea]:!shadow-none"
                        >
                          <Textarea
                            className="app-scrollbar"
                            autoSize={{ minRows: 2, maxRows: 6 }}
                            maxLength={2000}
                            aria-label={t('form.topic')}
                            placeholder={
                              topicRequired
                                ? t('form.topicPlaceholder')
                                : t('form.detailPlaceholder')
                            }
                          />
                        </Form.Item>
                        <div className="mt-2 flex items-center justify-between">
                          <AttachButton disabled={attachments.full} onPick={attachments.add} />
                          <SendButton
                            label={t('form.submit')}
                            loading={start.isPending}
                            disabled={!ready || attachments.uploading}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          </Form>
        )}
      </Modal>
      {profileOpen ? (
        <BrandAiProfileModal brandId={brandId} onClose={() => setProfileOpen(false)} />
      ) : null}
    </>
  )
}

/** One option row: an icon tile, the label, and a switch in the AI purple. */
function OptionSwitch({
  name,
  icon,
  label,
}: {
  name: 'wantsImage' | 'autoSubmit'
  icon: ReactNode
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-ai-100 bg-bg-surface text-icon-sm text-ai-600 shadow-xs"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-label-md text-text-primary">{label}</span>
      <Form.Item name={name} valuePropName="checked" noStyle>
        <Switch tone="ai" size="small" />
      </Form.Item>
    </label>
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
      className="flex size-[36px] shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-ai-400 to-ai-600 text-icon-sm text-text-inverse shadow-[0_4px_14px_-4px] shadow-ai-500/60 transition-[filter] duration-fast hover:brightness-110 focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
    >
      {loading ? <Spin size="sm" /> : <IconSend aria-hidden />}
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

function ProfileCard({ hasProfile, onOpen }: { hasProfile: boolean; onOpen: () => void }) {
  const { t } = useTranslation('aiContent')
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-auto flex h-[48px] w-full items-center gap-2 rounded-xl border border-ai-100 bg-bg-surface/80 px-3 text-start shadow-xs transition-colors hover:border-ai-300 hover:bg-bg-surface focus-visible:focus-ring"
    >
      <IconLayers aria-hidden className="shrink-0 text-icon-md text-ai-500" />
      <span className="min-w-0 flex-1 truncate text-label-md text-text-primary">
        {t(hasProfile ? 'profile.edit' : 'profile.setUp')}
      </span>
      <IconChevronRight aria-hidden className="shrink-0 text-icon-sm text-text-tertiary" />
    </button>
  )
}

/** A Form-controlled list of Pages to post to. */
function PagePicker({
  pages,
  value = [],
  onChange,
}: {
  pages: AiAvailability['pages']
  value?: string[]
  onChange?: (value: string[]) => void
}) {
  const toggle = (id: string, checked: boolean) =>
    onChange?.(checked ? [...value, id] : value.filter((item) => item !== id))
  return (
    <div className="app-scrollbar grid max-h-[232px] grid-cols-[minmax(0,1fr)] gap-2 overflow-y-auto p-[2px]">
      {pages.map((page) => {
        const checked = value.includes(page.id)
        return (
          <label
            key={page.id}
            className={
              'flex cursor-pointer items-center gap-3 h-[48px] rounded-xl border px-3 transition-colors has-[:focus-visible]:focus-ring ' +
              (checked
                ? 'border-ai-400 bg-bg-surface/70 shadow-xs'
                : 'border-transparent hover:border-ai-200 hover:bg-bg-surface/50')
            }
          >
            <input
              type="checkbox"
              className="sr-only"
              aria-label={page.name}
              checked={checked}
              onChange={(event) => toggle(page.id, event.target.checked)}
            />
            <Avatar name={page.name} src={page.avatarUrl} size="sm" />
            <span className="min-w-0 flex-1 truncate text-label-md text-text-primary">
              {page.name}
            </span>
            <span
              aria-hidden
              className={
                'flex size-5 shrink-0 items-center justify-center rounded-full text-caption transition-colors ' +
                (checked ? 'bg-ai-500 text-text-inverse' : 'border border-ai-200 bg-bg-surface')
              }
            >
              {checked ? <IconCheck /> : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}

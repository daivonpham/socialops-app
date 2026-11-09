import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Avatar,
  Button,
  Form,
  IconChat,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconInfo,
  IconLayers,
  IconPanelLeftClose,
  IconPanelLeftOpen,
  IconPlus,
  IconSearch,
  IconSendLine,
  IconSliders,
  Input,
  Spin,
  Switch,
  Tooltip,
} from '@/shared/ui'
import { useAiConversations, type AiAvailability, type AiConversationSummary } from '../api'
import { AiMark } from './AiMark'

type Pages = AiAvailability['pages']
/** Chats active this many days ago or later are "Recent"; older ones "Earlier". */
const RECENT_DAYS = 7
/** Chats shown as icons on the collapsed rail. */
const RAIL_CHATS = 6
const AVATARS_SHOWN = 3

const rowButton =
  'flex h-[40px] w-full items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface/80 px-3 text-start shadow-xs transition-colors hover:border-ai-300 hover:bg-bg-surface focus-visible:focus-ring'
const railButton =
  'flex size-[40px] items-center justify-center rounded-lg text-icon-md transition-colors hover:bg-bg-surface hover:text-ai-600 focus-visible:focus-ring'
const railNeutral = railButton + ' text-text-secondary'
const railAi = railButton + ' text-ai-600'

/** Page avatars overlapping, with "+n" for the ones not shown. */
function AvatarStack({ pages, size = 'sm' }: { pages: Pages; size?: 'xs' | 'sm' }) {
  const shown = pages.slice(0, AVATARS_SHOWN)
  const rest = pages.length - shown.length
  const overlap = size === 'xs' ? '-ms-[6px]' : '-ms-2'
  return (
    <span aria-hidden className="flex shrink-0 items-center">
      {shown.map((page, index) => (
        <span
          key={page.id}
          className={'rounded-full ring-2 ring-bg-surface ' + (index ? overlap : '')}
        >
          <Avatar
            name={page.name}
            src={page.avatarUrl}
            size={size}
            fallbackClassName="text-caption"
          />
        </span>
      ))}
      {rest > 0 ? (
        <span
          className={
            overlap +
            ' flex items-center justify-center rounded-full bg-ai-100 text-label-sm text-ai-700 ring-2 ring-bg-surface ' +
            (size === 'xs' ? 'size-6' : 'size-8')
          }
        >
          +{rest}
        </span>
      ) : null}
    </span>
  )
}

/** A menu row that opens its items right below it, like a tree. */
function MenuSection({
  open,
  onToggle,
  label,
  header,
  children,
}: {
  open: boolean
  onToggle: () => void
  /** What the row is, for screen readers, when `header` shows something else. */
  label?: string
  header: ReactNode
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface/80 shadow-xs">
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={onToggle}
        className="flex h-[40px] w-full items-center gap-3 px-3 text-start transition-colors hover:bg-bg-surface focus-visible:focus-ring"
      >
        {header}
        <IconChevronDown
          aria-hidden
          className={
            'shrink-0 text-caption text-text-tertiary transition-transform duration-fast ' +
            (open ? 'rotate-180' : '')
          }
        />
      </button>
      {open ? (
        <div className="border-t border-border-subtle bg-bg-surface-subtle p-1">{children}</div>
      ) : null}
    </div>
  )
}

/** The Pages to post to, checked in a list under the Pages row. */
function PageList({ pages }: { pages: Pages }) {
  const { t } = useTranslation('aiContent')
  const form = Form.useFormInstance()
  const value: string[] = Form.useWatch('pageIds', form) ?? []
  const onChange = (next: string[]) => form.setFieldValue('pageIds', next)
  return (
    <div
      role="group"
      aria-label={t('form.pages')}
      className="app-scrollbar grid max-h-[200px] grid-cols-[minmax(0,1fr)] gap-1 overflow-y-auto"
    >
      {pages.map((page) => {
        const checked = value.includes(page.id)
        return (
          <label
            key={page.id}
            className={
              'flex h-[44px] cursor-pointer items-center gap-3 rounded-lg ps-4 pe-3 transition-colors has-[:focus-visible]:focus-ring ' +
              (checked ? 'bg-ai-50' : 'hover:bg-bg-surface')
            }
          >
            <input
              type="checkbox"
              className="sr-only"
              aria-label={page.name}
              checked={checked}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...value, page.id]
                    : value.filter((item) => item !== page.id),
                )
              }
            />
            <Avatar
              name={page.name}
              src={page.avatarUrl}
              size="xs"
              fallbackClassName="text-caption"
            />
            <span className="min-w-0 flex-1 truncate text-body-sm text-text-primary">
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

/**
 * The Pages row, a Form control. One Page is simply used; with several, picked Pages show as
 * overlapping avatars and their names, and the list opens under the row.
 */
function PageSelector({
  pages,
  compact,
  open,
  onToggle,
  value = [],
}: {
  pages: Pages
  compact: boolean
  open: boolean
  /** Opens or closes the list; on the collapsed rail, opens the column on it. */
  onToggle: () => void
  /** From the Form; the list changes it. */
  value?: string[]
}) {
  const { t } = useTranslation('aiContent')
  const single = pages.length === 1
  const selected = pages.filter((page) => value.includes(page.id))
  const label = selected.length
    ? selected.map((page) => page.name).join(', ')
    : t('sidebar.pickPages')

  if (single) {
    const page = pages[0]!
    return compact ? (
      <Tooltip title={page.name} placement="right">
        <span className="flex size-[40px] items-center justify-center">
          <Avatar name={page.name} src={page.avatarUrl} size="sm" />
        </span>
      </Tooltip>
    ) : (
      <div className="flex h-[40px] items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface/80 px-3 shadow-xs">
        <Avatar name={page.name} src={page.avatarUrl} size="xs" fallbackClassName="text-caption" />
        <span className="min-w-0 flex-1 truncate text-label-md text-text-primary">{page.name}</span>
      </div>
    )
  }

  if (compact)
    return (
      <Tooltip title={label} placement="right">
        <button
          type="button"
          aria-label={t('sidebar.pagesLabel', { pages: label })}
          onClick={onToggle}
          className={railAi}
        >
          {selected.length ? (
            <AvatarStack pages={selected.slice(0, 1)} />
          ) : (
            <IconPlus aria-hidden />
          )}
        </button>
      </Tooltip>
    )

  return (
    <MenuSection
      open={open}
      onToggle={onToggle}
      label={t('sidebar.pagesLabel', { pages: label })}
      header={
        <>
          {selected.length ? (
            <AvatarStack pages={selected} size="xs" />
          ) : (
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-ai-300 text-icon-sm text-ai-600"
            >
              <IconPlus />
            </span>
          )}
          <span
            className={
              'min-w-0 flex-1 truncate text-label-md ' +
              (selected.length ? 'text-text-primary' : 'text-ai-700')
            }
          >
            {label}
          </span>
        </>
      }
    >
      <PageList pages={pages} />
    </MenuSection>
  )
}

function OptionSwitch({
  name,
  icon,
  label,
}: {
  name: 'autoSubmit'
  icon: ReactNode
  label: string
}) {
  return (
    <label className="flex h-[44px] cursor-pointer items-center gap-3 rounded-lg ps-4 pe-3 hover:bg-bg-surface">
      <span aria-hidden className="shrink-0 text-icon-sm text-ai-600">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-body-sm text-text-primary">{label}</span>
      <Form.Item name={name} valuePropName="checked" noStyle>
        <Switch tone="ai" size="small" />
      </Form.Item>
    </label>
  )
}

/** "Post options": the switches, under their row. */
function OptionsMenu({
  compact,
  open,
  onToggle,
}: {
  compact: boolean
  open: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation('aiContent')
  if (compact)
    return (
      <Tooltip title={t('sidebar.options')} placement="right">
        <button
          type="button"
          aria-label={t('sidebar.options')}
          onClick={onToggle}
          className={railAi}
        >
          <IconSliders aria-hidden />
        </button>
      </Tooltip>
    )
  return (
    <MenuSection
      open={open}
      onToggle={onToggle}
      header={
        <>
          <IconSliders aria-hidden className="shrink-0 text-icon-md text-ai-500" />
          <span className="min-w-0 flex-1 truncate text-label-md text-text-primary">
            {t('sidebar.options')}
          </span>
        </>
      }
    >
      <OptionSwitch name="autoSubmit" icon={<IconSendLine />} label={t('form.autoSubmit')} />
    </MenuSection>
  )
}

function ProfileButton({
  hasProfile,
  compact,
  onOpen,
}: {
  hasProfile: boolean
  compact: boolean
  onOpen: () => void
}) {
  const { t } = useTranslation('aiContent')
  const label = t(hasProfile ? 'profile.edit' : 'profile.setUp')
  // Without a profile, a purple dot marks it as worth doing.
  const dot = hasProfile ? null : (
    <span aria-hidden className="size-2 shrink-0 rounded-full bg-ai-500" />
  )
  return compact ? (
    <Tooltip title={label} placement="right">
      <button type="button" aria-label={label} onClick={onOpen} className={railAi + ' relative'}>
        <IconLayers aria-hidden />
        {dot ? <span className="absolute end-[6px] top-[6px] flex">{dot}</span> : null}
      </button>
    </Tooltip>
  ) : (
    <button type="button" onClick={onOpen} className={rowButton}>
      <IconLayers aria-hidden className="shrink-0 text-icon-md text-ai-500" />
      <span className="min-w-0 flex-1 truncate text-label-md text-text-primary">{label}</span>
      {dot}
      <IconChevronRight aria-hidden className="shrink-0 text-caption text-text-tertiary" />
    </button>
  )
}

/**
 * In place of the history while there is no chat yet: three steps to a first post, each ticked
 * once done, each taking the person where it is done.
 */
function GettingStarted({
  hasProfile,
  singlePage,
  historyDays,
  onProfile,
  onPages,
  onRequest,
}: {
  hasProfile: boolean
  singlePage: boolean
  historyDays: number
  onProfile: () => void
  onPages: () => void
  onRequest: () => void
}) {
  const { t } = useTranslation('aiContent')
  const form = Form.useFormInstance()
  const pageIds: string[] = Form.useWatch('pageIds', form) ?? []
  const steps = [
    { key: 'profile', done: hasProfile, onClick: onProfile },
    { key: 'pages', done: singlePage || pageIds.length > 0, onClick: onPages },
    { key: 'request', done: false, onClick: onRequest },
  ] as const
  return (
    <section aria-label={t('start.title')} className="flex flex-1 shrink-0 flex-col gap-3">
      <h4 className="px-2 text-label-sm tracking-[0.04em] text-text-tertiary uppercase">
        {t('start.title')}
      </h4>
      <ol className="grid gap-2">
        {steps.map((step, index) => (
          <li key={step.key}>
            <button
              type="button"
              onClick={step.onClick}
              className="flex w-full items-start gap-3 rounded-xl border border-border-subtle bg-bg-surface/80 p-3 text-start shadow-xs transition-colors hover:border-ai-300 hover:bg-bg-surface focus-visible:focus-ring"
            >
              <span
                aria-hidden
                className={
                  'mt-[2px] flex size-5 shrink-0 items-center justify-center rounded-full text-caption ' +
                  (step.done
                    ? 'bg-ai-500 text-text-inverse'
                    : 'border border-ai-300 bg-bg-surface text-ai-600')
                }
              >
                {step.done ? <IconCheck /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={
                    'block text-label-md ' +
                    (step.done ? 'text-text-tertiary' : 'text-text-primary')
                  }
                >
                  {t(`start.${step.key}`)}
                  {step.done ? <span className="sr-only"> ({t('start.done')})</span> : null}
                </span>
                <span className="block text-caption text-text-tertiary">
                  {t(`start.${step.key}Hint`)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="px-2 text-caption text-text-tertiary">
        {t('start.kept', { count: historyDays })}
      </p>
    </section>
  )
}

/** Chats split into "Recent" and "Earlier", filtered by the search. */
function ChatList({
  conversations,
  currentId,
  historyDays,
  onPick,
}: {
  conversations: AiConversationSummary[]
  currentId: string | null
  historyDays: number
  onPick: (id: string) => void
}) {
  const { t } = useTranslation('aiContent')
  const [query, setQuery] = useState('')
  const groups = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    const shown = conversations.filter(
      (item) => !needle || item.title.toLocaleLowerCase().includes(needle),
    )
    const since = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000
    return [
      {
        key: 'recent' as const,
        items: shown.filter((item) => Date.parse(item.lastActivityAt) >= since),
      },
      {
        key: 'earlier' as const,
        items: shown.filter((item) => Date.parse(item.lastActivityAt) < since),
      },
    ].filter((group) => group.items.length)
  }, [conversations, query])
  const kept = t('history.kept', { count: historyDays })

  return (
    <div className="flex min-h-[200px] flex-1 flex-col gap-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        prefix={<IconSearch aria-hidden className="text-text-tertiary" />}
        placeholder={t('history.search')}
        aria-label={t('history.search')}
        allowClear
      />
      <div className="app-scrollbar -me-2 min-h-0 flex-1 overflow-y-auto pe-2">
        {groups.length === 0 ? (
          <p className="py-6 text-center text-body-sm text-text-tertiary">
            {t(query.trim() ? 'history.noMatch' : 'history.empty')}
          </p>
        ) : (
          groups.map((group, index) => (
            <section key={group.key} className="mb-4" aria-label={t(`history.${group.key}`)}>
              <h4 className="mb-2 flex items-center gap-1 px-2 text-label-sm tracking-[0.04em] text-text-tertiary uppercase">
                {t(`history.${group.key}`)}
                {index === 0 ? (
                  <Tooltip title={kept}>
                    <span
                      role="img"
                      tabIndex={0}
                      aria-label={kept}
                      className="flex normal-case focus-visible:focus-ring"
                    >
                      <IconInfo aria-hidden />
                    </span>
                  </Tooltip>
                ) : null}
              </h4>
              <ul className="grid gap-1">
                {group.items.map((item) => {
                  const current = item.id === currentId
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-current={current ? 'true' : undefined}
                        onClick={() => onPick(item.id)}
                        className={
                          'block w-full truncate rounded-lg px-3 py-2 text-start text-body-sm transition-colors focus-visible:focus-ring ' +
                          (current
                            ? 'bg-ai-100 font-semibold text-text-primary'
                            : 'text-text-secondary hover:bg-bg-surface/70 hover:text-text-primary')
                        }
                      >
                        {item.title || t('history.untitled')}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

/**
 * The left column: new chat, the chat history, then the Pages, post options and Brand profile.
 * Collapsed, it keeps icons only, each with a tooltip.
 */
export function AiSidebar({
  brandId,
  pages,
  hasProfile,
  historyDays,
  currentId,
  collapsed,
  background,
  onToggle,
  onPick,
  onNew,
  onOpenProfile,
  onStartTyping,
}: {
  brandId: string
  pages: Pages
  hasProfile: boolean
  historyDays: number
  currentId: string | null
  collapsed: boolean
  background: string
  onToggle: () => void
  onPick: (id: string) => void
  onNew: () => void
  onOpenProfile: () => void
  /** Puts the cursor in the composer. */
  onStartTyping: () => void
}) {
  const { t } = useTranslation('aiContent')
  const conversations = useAiConversations(brandId)
  const form = Form.useFormInstance()
  // One row open at a time, so the chat history keeps its room. With several Pages and none
  // picked yet, the Pages row starts open.
  const [openRow, setOpenRow] = useState<'pages' | 'options' | null>(() =>
    pages.length > 1 && !(form.getFieldValue('pageIds') as string[] | undefined)?.length
      ? 'pages'
      : null,
  )
  // On the collapsed rail a row's icon opens the column with that row open.
  const toggleRow = (row: 'pages' | 'options') => () => {
    if (collapsed) {
      setOpenRow(row)
      onToggle()
    } else setOpenRow((open) => (open === row ? null : row))
  }
  const pagesField = (
    <Form.Item name="pageIds" noStyle>
      <PageSelector
        pages={pages}
        compact={collapsed}
        open={openRow === 'pages'}
        onToggle={toggleRow('pages')}
      />
    </Form.Item>
  )
  const optionsField = (
    <OptionsMenu compact={collapsed} open={openRow === 'options'} onToggle={toggleRow('options')} />
  )

  if (collapsed)
    return (
      <aside
        aria-label={t('modal.title')}
        className="flex flex-col items-center gap-2 border-e border-ai-100 bg-ai-50 px-4 py-5"
      >
        <span className="flex size-[40px] items-center justify-center" title={t('modal.title')}>
          <AiMark className="w-[24px]" />
        </span>
        <Tooltip title={t('sidebar.expand')} placement="right">
          <button
            type="button"
            aria-label={t('sidebar.expand')}
            onClick={onToggle}
            className={railNeutral}
          >
            <IconPanelLeftOpen aria-hidden />
          </button>
        </Tooltip>
        <div aria-hidden className="h-px w-full bg-ai-100" />
        <Tooltip title={t('history.new')} placement="right">
          <button type="button" aria-label={t('history.new')} onClick={onNew} className={railAi}>
            <IconPlus aria-hidden />
          </button>
        </Tooltip>
        <ul className="grid gap-1" aria-label={t('history.title')}>
          {(conversations.data ?? []).slice(0, RAIL_CHATS).map((item) => (
            <li key={item.id}>
              <Tooltip title={item.title || t('history.untitled')} placement="right">
                <button
                  type="button"
                  aria-label={item.title || t('history.untitled')}
                  aria-current={item.id === currentId ? 'true' : undefined}
                  onClick={() => onPick(item.id)}
                  className={
                    item.id === currentId ? railButton + ' bg-ai-100 text-ai-700' : railNeutral
                  }
                >
                  <IconChat aria-hidden />
                </button>
              </Tooltip>
            </li>
          ))}
        </ul>
        <div className="mt-auto grid justify-items-center gap-2 border-t border-ai-100 pt-3">
          {pagesField}
          {optionsField}
          <ProfileButton hasProfile={hasProfile} compact onOpen={onOpenProfile} />
        </div>
      </aside>
    )

  return (
    <aside
      aria-label={t('modal.title')}
      className="app-scrollbar flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto border-b border-ai-100 bg-ai-50 bg-cover bg-right-bottom p-5 md:border-e md:border-b-0"
      // Quoted: a small SVG is inlined as a data URL that may hold spaces.
      style={{ backgroundImage: `url("${background}")` }}
    >
      <div className="flex items-center gap-2">
        <h2 className="flex flex-1 items-center gap-2 text-heading-4 text-text-primary">
          <AiMark className="w-[28px]" />
          {t('modal.title')}
        </h2>
        <Tooltip title={t('sidebar.collapse')}>
          <button
            type="button"
            aria-label={t('sidebar.collapse')}
            onClick={onToggle}
            className="hidden size-[32px] items-center justify-center rounded-lg text-icon-md text-text-secondary transition-colors hover:bg-bg-surface hover:text-ai-600 focus-visible:focus-ring md:flex"
          >
            <IconPanelLeftClose aria-hidden />
          </button>
        </Tooltip>
      </div>

      <button
        type="button"
        onClick={onNew}
        className="flex h-[40px] shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-ai-400 to-ai-600 text-label-md text-text-inverse shadow-[0_4px_14px_-4px] shadow-ai-500/60 transition-[filter] hover:brightness-110 focus-visible:focus-ring"
      >
        <IconPlus aria-hidden className="text-icon-md" />
        {t('history.new')}
      </button>

      {conversations.isPending ? (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <Spin />
        </div>
      ) : conversations.isError ? (
        // Small on purpose: the column still has to show the Pages and options below.
        <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-body-sm text-text-secondary">{t('history.loadError')}</p>
          <Button size="sm" onClick={() => void conversations.refetch()}>
            {t('progress.tryAgain')}
          </Button>
        </div>
      ) : conversations.data.length === 0 ? (
        <GettingStarted
          hasProfile={hasProfile}
          singlePage={pages.length === 1}
          historyDays={historyDays}
          onProfile={onOpenProfile}
          onPages={() => setOpenRow('pages')}
          onRequest={onStartTyping}
        />
      ) : (
        <ChatList
          conversations={conversations.data}
          currentId={currentId}
          historyDays={historyDays}
          onPick={onPick}
        />
      )}

      <div className="grid shrink-0 grid-cols-[minmax(0,1fr)] gap-2 border-t border-ai-100 pt-4">
        {pagesField}
        {optionsField}
        <ProfileButton hasProfile={hasProfile} compact={false} onOpen={onOpenProfile} />
      </div>
    </aside>
  )
}

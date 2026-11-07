import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useApiErrorMessage } from '@/shared/hooks'
import {
  Button,
  Form,
  IconBlocked,
  IconCheck,
  IconCheckCircle,
  IconClose,
  IconPlus,
  IconThumbsUp,
  Input,
  Modal,
  SectionError,
  Spin,
  Textarea,
  useToast,
} from '@/shared/ui'
import {
  AI_TONE_PRESETS,
  useBrandAiProfile,
  useUpdateBrandAiProfile,
  type AiTonePreset,
  type BrandAiProfile,
} from '../api'
import { AiBadgeIcon } from './AiBadgeIcon'

/** Same limits as the API, so a word list never fails on save. */
const WORDS_MAX = 50
const WORD_MAX_LENGTH = 100

type Values = {
  industry?: string
  products?: string
  targetAudience?: string
  tonePreset?: AiTonePreset | null
  toneNotes?: string
  preferredWords?: string[]
  bannedWords?: string[]
}

const orNull = (text: string | undefined): string | null => text?.trim() || null

/** A numbered area of the form; `tinted` gives the AI purple ground. */
function Section({
  step,
  title,
  tinted = false,
  className = '',
  children,
}: {
  step: string
  title: string
  tinted?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={
        'rounded-xl border p-5 ' +
        (tinted ? 'border-ai-100 bg-ai-50 ' : 'border-border-subtle bg-bg-surface ') +
        className
      }
    >
      <h3 className="mb-4 flex items-center gap-3 text-heading-4 text-text-primary">
        <span className="rounded-md bg-ai-100 px-2 py-1 text-label-sm text-ai-700 tabular-nums">
          {step}
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}

/** Single choice that can be cleared by picking the chosen tone again. */
function TonePicker({
  value,
  onChange,
}: {
  value?: AiTonePreset | null
  onChange?: (value: AiTonePreset | null) => void
}) {
  const { t } = useTranslation('aiContent')
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('profileForm.tone')}>
      {AI_TONE_PRESETS.map((tone) => {
        const selected = value === tone
        return (
          <button
            key={tone}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange?.(selected ? null : tone)}
            className={
              'inline-flex h-[36px] items-center gap-2 rounded-full border px-4 text-label-md transition-colors focus-visible:focus-ring ' +
              (selected
                ? 'border-ai-400 bg-ai-100 text-ai-700'
                : 'border-border-subtle bg-bg-surface text-text-secondary hover:border-ai-300 hover:text-text-primary')
            }
          >
            {selected ? (
              <span
                aria-hidden
                className="flex size-4 items-center justify-center rounded-full bg-ai-500 text-caption text-text-inverse"
              >
                <IconCheck />
              </span>
            ) : null}
            {t(`profileForm.tones.${tone}`)}
          </button>
        )
      })}
    </div>
  )
}

/** Words as removable chips; "+" opens a field where Enter adds one. */
function WordTags({
  value = [],
  onChange,
  tone,
  label,
}: {
  value?: string[]
  onChange?: (value: string[]) => void
  tone: 'ai' | 'neutral'
  label: string
}) {
  const { t } = useTranslation('aiContent')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const full = value.length >= WORDS_MAX

  const commit = () => {
    const word = draft.trim()
    const known = value.some((item) => item.toLowerCase() === word.toLowerCase())
    if (word && !known && !full) onChange?.([...value, word])
    setDraft('')
  }

  const chip = tone === 'ai' ? 'bg-ai-100 text-ai-700' : 'bg-bg-surface-subtle text-text-secondary'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((word) => (
        <span
          key={word}
          className={`inline-flex h-[28px] items-center gap-1 rounded-full ps-3 pe-1 text-body-sm ${chip}`}
        >
          {word}
          <button
            type="button"
            aria-label={t('profileForm.removeWord', { word })}
            onClick={() => onChange?.(value.filter((item) => item !== word))}
            className="flex size-5 items-center justify-center rounded-full text-caption opacity-70 transition-opacity hover:opacity-100 focus-visible:focus-ring"
          >
            <IconClose aria-hidden />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          // Opened on purpose by the "+" button, so taking focus is expected.
          autoFocus
          value={draft}
          maxLength={WORD_MAX_LENGTH}
          aria-label={t('profileForm.addWord', { list: label })}
          placeholder={t('profileForm.wordPlaceholder')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              // Enter adds the word; it must not submit the whole form.
              event.preventDefault()
              commit()
            } else if (event.key === 'Escape') {
              event.stopPropagation()
              setDraft('')
              setAdding(false)
            }
          }}
          onBlur={() => {
            commit()
            setAdding(false)
          }}
          className="h-[28px] w-[140px] rounded-full border border-ai-300 bg-bg-surface px-3 text-body-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-ai-500"
        />
      ) : full ? null : (
        <button
          type="button"
          aria-label={t('profileForm.addWord', { list: label })}
          onClick={() => setAdding(true)}
          className={
            'flex size-[28px] items-center justify-center rounded-full border text-icon-sm transition-colors focus-visible:focus-ring ' +
            (tone === 'ai'
              ? 'border-ai-300 text-ai-600 hover:bg-ai-50'
              : 'border-border-subtle text-text-secondary hover:bg-bg-surface-subtle')
          }
        >
          <IconPlus aria-hidden />
        </button>
      )}
    </div>
  )
}

function WordBox({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  const { t } = useTranslation('aiContent')
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span aria-hidden className="text-icon-md">
          {icon}
        </span>
        <span className="flex-1 text-label-md text-text-primary">{title}</span>
        <span className="text-caption text-text-tertiary">{t('profileForm.wordsHint')}</span>
      </div>
      {children}
    </div>
  )
}

function ProfileForm({
  brandId,
  profile,
  onClose,
}: {
  brandId: string
  profile: BrandAiProfile
  onClose: () => void
}) {
  const { t } = useTranslation('aiContent')
  const errorMessage = useApiErrorMessage('aiContent')
  const toast = useToast()
  const update = useUpdateBrandAiProfile()

  const submit = async (values: Values) => {
    try {
      await update.mutateAsync({
        brandId,
        industry: orNull(values.industry),
        products: orNull(values.products),
        targetAudience: orNull(values.targetAudience),
        tonePreset: values.tonePreset ?? null,
        toneNotes: orNull(values.toneNotes),
        preferredWords: values.preferredWords ?? [],
        bannedWords: values.bannedWords ?? [],
      })
    } catch (error) {
      toast.error({ title: errorMessage(error, t('profileForm.saveError')) })
      return
    }
    toast.success({ title: t('profileForm.saved') })
    onClose()
  }

  return (
    <Form<Values>
      layout="vertical"
      className="mt-4"
      requiredMark={false}
      initialValues={{
        industry: profile.industry ?? '',
        products: profile.products ?? '',
        targetAudience: profile.targetAudience ?? '',
        tonePreset: profile.tonePreset ?? null,
        toneNotes: profile.toneNotes ?? '',
        preferredWords: profile.preferredWords,
        bannedWords: profile.bannedWords,
      }}
      onFinish={(values) => void submit(values)}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Section step="01" title={t('profileForm.sections.brand')}>
          <Form.Item name="industry" label={t('profileForm.industry')}>
            <Input maxLength={200} placeholder={t('profileForm.industryPlaceholder')} />
          </Form.Item>
          <Form.Item name="products" label={t('profileForm.products')}>
            <Textarea rows={3} maxLength={5000} />
          </Form.Item>
          <Form.Item name="targetAudience" label={t('profileForm.audience')} className="!mb-0">
            <Textarea rows={3} maxLength={2000} />
          </Form.Item>
        </Section>

        <Section step="02" title={t('profileForm.sections.voice')} tinted>
          <Form.Item name="tonePreset" label={t('profileForm.tone')}>
            <TonePicker />
          </Form.Item>
          <Form.Item name="toneNotes" label={t('profileForm.toneNotes')} className="!mb-0">
            <Textarea rows={4} maxLength={2000} />
          </Form.Item>
        </Section>

        <Section step="03" title={t('profileForm.sections.words')} className="md:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <WordBox
              icon={<IconThumbsUp className="text-ai-500" />}
              title={t('profileForm.preferredWords')}
            >
              <Form.Item name="preferredWords" noStyle>
                <WordTags tone="ai" label={t('profileForm.preferredWords')} />
              </Form.Item>
            </WordBox>
            <WordBox
              icon={<IconBlocked className="text-text-secondary" />}
              title={t('profileForm.bannedWords')}
            >
              <Form.Item name="bannedWords" noStyle>
                <WordTags tone="neutral" label={t('profileForm.bannedWords')} />
              </Form.Item>
            </WordBox>
          </div>
        </Section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border-subtle pt-4">
        <p className="flex flex-1 items-center gap-2 text-body-sm text-text-secondary">
          <IconCheckCircle aria-hidden className="shrink-0 text-icon-md text-success-500" />
          {t('profileForm.appliesNext')}
        </p>
        <Button disabled={update.isPending} onClick={onClose}>
          {t('profileForm.cancel')}
        </Button>
        <Button variant="primary" htmlType="submit" loading={update.isPending}>
          {t('profileForm.save')}
        </Button>
      </div>
    </Form>
  )
}

export function BrandAiProfileModal({
  brandId,
  onClose,
}: {
  brandId: string
  onClose: () => void
}) {
  const { t } = useTranslation('aiContent')
  const profile = useBrandAiProfile(brandId)

  return (
    <Modal
      open
      title={t('profileForm.title')}
      headerIcon={<AiBadgeIcon />}
      headerDescription={t('profileForm.description')}
      headerLayout="horizontal"
      width={960}
      onClose={onClose}
      footer={null}
    >
      {profile.isPending ? (
        <div className="flex justify-center py-10">
          <Spin size="lg" />
        </div>
      ) : profile.isError ? (
        <SectionError
          title={t('profileForm.loadError')}
          retryLabel={t('profileForm.retry')}
          onRetry={() => void profile.refetch()}
        />
      ) : (
        <ProfileForm brandId={brandId} profile={profile.data} onClose={onClose} />
      )}
    </Modal>
  )
}

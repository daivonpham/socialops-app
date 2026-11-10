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
  IconLayersLine,
  IconNote,
  IconPencil,
  IconPenLine,
  IconPlus,
  IconStore,
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
import voiceBackground from '@/assets/ai/brand-voice-background.svg'
import { AiBadgeIcon } from './AiBadgeIcon'
import { toProfileInput, type ProfileValues as Values } from './profileValues'

/** Same limits as the API, so a word list never fails on save. */
const WORDS_MAX = 50
const WORD_MAX_LENGTH = 100

/** An area of the form led by its icon; `tinted` lays the AI voice artwork underneath. */
function Section({
  icon,
  title,
  tinted = false,
  className = '',
  children,
}: {
  icon: ReactNode
  title: string
  tinted?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={
        'rounded-xl p-4 ' +
        (tinted
          ? 'bg-[length:100%_100%] bg-no-repeat '
          : 'border border-border-subtle bg-bg-surface ') +
        className
      }
      style={tinted ? { backgroundImage: `url("${voiceBackground}")` } : undefined}
    >
      <h3 className="mb-3 flex items-center gap-2 text-heading-3 text-text-primary">
        <span aria-hidden className="text-icon-md text-ai-500">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}

/** Bold field label with an optional purple icon in front. */
function FieldLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-label-md font-semibold text-text-primary">
      {icon ? (
        <span aria-hidden className="text-icon-md text-ai-500">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
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
                : 'border-border-subtle bg-bg-surface text-text-primary hover:border-ai-300')
            }
          >
            {t(`profileForm.tones.${tone}`)}
            {selected ? <IconCheck aria-hidden className="text-ai-600" /> : null}
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
  label,
}: {
  value?: string[]
  onChange?: (value: string[]) => void
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((word) => (
        <span
          key={word}
          className="inline-flex h-[28px] items-center gap-1 rounded-full bg-ai-100 ps-3 pe-1 text-body-sm text-ai-700"
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
          className="flex size-[28px] items-center justify-center rounded-full border border-ai-300 text-icon-sm text-ai-600 transition-colors hover:bg-ai-50 focus-visible:focus-ring"
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
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-3">
      <div className="mb-2 flex items-center gap-2">
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

export function ProfileForm({
  form,
  profile,
  onFinish,
}: {
  form: ReturnType<typeof Form.useForm<Values>>[0]
  profile: BrandAiProfile
  onFinish: (values: Values) => void
}) {
  const { t } = useTranslation('aiContent')

  return (
    <Form<Values>
      form={form}
      layout="vertical"
      // Label to field 6px, per the spacing scale in design.md §10.
      className="[&_.ant-form-item-label]:!pb-1.5"
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
      onFinish={onFinish}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Section icon={<IconStore />} title={t('profileForm.sections.brand')}>
          <Form.Item
            name="industry"
            label={<FieldLabel>{t('profileForm.industry')}</FieldLabel>}
            className="!mb-4"
          >
            <Input
              maxLength={200}
              prefix={<IconPencil aria-hidden className="me-1 text-ai-400" />}
              placeholder={t('profileForm.industryPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            name="products"
            label={<FieldLabel>{t('profileForm.products')}</FieldLabel>}
            className="!mb-4"
          >
            <Textarea rows={2} maxLength={5000} />
          </Form.Item>
          <Form.Item
            name="targetAudience"
            label={<FieldLabel>{t('profileForm.audience')}</FieldLabel>}
            className="!mb-0"
          >
            <Textarea rows={2} maxLength={2000} />
          </Form.Item>
        </Section>

        <Section icon={<IconPenLine />} title={t('profileForm.sections.voice')} tinted>
          <Form.Item
            name="tonePreset"
            label={<FieldLabel>{t('profileForm.tone')}</FieldLabel>}
            className="!mb-4"
          >
            <TonePicker />
          </Form.Item>
          <Form.Item
            name="toneNotes"
            label={<FieldLabel icon={<IconNote />}>{t('profileForm.toneNotes')}</FieldLabel>}
            className="!mb-0"
          >
            <Textarea rows={5} maxLength={2000} />
          </Form.Item>
        </Section>

        <Section
          icon={<IconLayersLine />}
          title={t('profileForm.sections.words')}
          className="md:col-span-2"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <WordBox
              icon={<IconThumbsUp className="text-ai-500" />}
              title={t('profileForm.preferredWords')}
            >
              <Form.Item name="preferredWords" noStyle>
                <WordTags label={t('profileForm.preferredWords')} />
              </Form.Item>
            </WordBox>
            <WordBox
              icon={<IconBlocked className="text-text-primary" />}
              title={t('profileForm.bannedWords')}
            >
              <Form.Item name="bannedWords" noStyle>
                <WordTags label={t('profileForm.bannedWords')} />
              </Form.Item>
            </WordBox>
          </div>
        </Section>
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
  const errorMessage = useApiErrorMessage('aiContent')
  const toast = useToast()
  const profile = useBrandAiProfile(brandId)
  const update = useUpdateBrandAiProfile()
  const [form] = Form.useForm<Values>()

  const submit = async (values: Values) => {
    try {
      await update.mutateAsync({ brandId, ...toProfileInput(values) })
    } catch (error) {
      toast.error({ title: errorMessage(error, t('profileForm.saveError')) })
      return
    }
    toast.success({ title: t('profileForm.saved') })
    onClose()
  }

  return (
    <Modal
      open
      title={t('profileForm.title')}
      headerIcon={
        <span className="flex items-center gap-4">
          <AiBadgeIcon />
          <span aria-hidden className="h-10 w-px bg-border-subtle" />
        </span>
      }
      headerDescription={t('profileForm.description')}
      headerLayout="horizontal"
      headerIconFramed={false}
      width={960}
      onClose={onClose}
      footer={
        profile.data ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex flex-1 items-center gap-2 text-start text-body-sm text-text-secondary">
              <IconCheckCircle aria-hidden className="shrink-0 text-icon-md text-success-500" />
              {t('profileForm.appliesNext')}
            </p>
            <Button disabled={update.isPending} onClick={onClose}>
              {t('profileForm.cancel')}
            </Button>
            <Button variant="primary" loading={update.isPending} onClick={() => form.submit()}>
              {t('profileForm.save')}
            </Button>
          </div>
        ) : null
      }
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
        <ProfileForm
          form={form}
          profile={profile.data}
          onFinish={(values) => void submit(values)}
        />
      )}
    </Modal>
  )
}

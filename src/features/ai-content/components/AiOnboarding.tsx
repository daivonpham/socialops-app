import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiErrorCode } from '@/shared/api/errors'
import { useApiErrorMessage } from '@/shared/hooks'
import { Button, Form, SectionError, Spin, useToast } from '@/shared/ui'
import {
  useAiOnboarding,
  useConfirmAiOnboarding,
  useSkipAiOnboarding,
  useSuggestAiProfile,
  type BrandAiProfile,
} from '../api'
import { AiMark } from './AiMark'
import { ProfileForm } from './BrandAiProfileModal'
import { toProfileInput, type ProfileValues } from './profileValues'

const EMPTY_PROFILE: BrandAiProfile = {
  industry: null,
  products: null,
  targetAudience: null,
  tonePreset: null,
  toneNotes: null,
  preferredWords: [],
  bannedWords: [],
  updatedAt: null,
}

/** The centred message of the steps before the form. */
function Message({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-8 pt-16 pb-12 text-center">
      {icon}
      <h2 className="mt-4 text-heading-2 text-text-primary">{title}</h2>
      <p className="mt-2 max-w-lg text-body-md text-text-secondary">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  )
}

/**
 * Shown once per Brand, before the chat: the AI reads the Page's posts and proposes a profile, the
 * customer corrects it, and confirming starts three sample suggestions in a new chat. Reading the
 * posts waits for a press, since it is a paid call and sends the posts to the AI.
 */
export function AiOnboarding({
  brandId,
  pageId,
  onFinished,
}: {
  brandId: string
  /** The Page the samples are written for. */
  pageId: string
  /** With the chat holding the samples, or nothing when there are none. */
  onFinished: (conversationId: string | null) => void
}) {
  const { t } = useTranslation('aiContent')
  const errorMessage = useApiErrorMessage('aiContent')
  const toast = useToast()
  const onboarding = useAiOnboarding(brandId)
  const suggest = useSuggestAiProfile()
  const skip = useSkipAiOnboarding()
  const confirm = useConfirmAiOnboarding()
  const [form] = Form.useForm<ProfileValues>()
  const [manual, setManual] = useState(false)
  // The same answer sent again keeps its key, so a lost reply cannot start the samples twice.
  const sent = useRef<{ key: string; values: string } | null>(null)
  const state = onboarding.data?.state
  const suggestion = suggest.data ?? onboarding.data?.suggestion ?? null
  const showForm = manual || state === 'few_posts' || suggestion !== null
  const busy = suggest.isPending || skip.isPending || confirm.isPending

  useEffect(() => {
    if (state === 'done') onFinished(null)
  }, [state, onFinished])

  const read = async () => {
    try {
      await suggest.mutateAsync(brandId)
    } catch (error) {
      toast.error({ title: errorMessage(error, t('onboarding.readError')) })
    }
  }

  const leave = async () => {
    try {
      await skip.mutateAsync(brandId)
    } catch (error) {
      toast.error({ title: errorMessage(error, t('onboarding.skipError')) })
      return
    }
    onFinished(null)
  }

  const submit = async (values: ProfileValues) => {
    const defaults = [
      t('onboarding.topicBrand'),
      t('onboarding.topicProduct'),
      t('onboarding.topicTip'),
    ]
    const topics = [...(suggestion?.ideas ?? []), ...defaults].slice(0, 3)
    const input = { ...toProfileInput(values), socialAccountId: pageId, topics }
    const serialized = JSON.stringify(input)
    if (sent.current?.values !== serialized)
      sent.current = { key: crypto.randomUUID(), values: serialized }
    try {
      const { conversationId } = await confirm.mutateAsync({
        brandId,
        idempotencyKey: sent.current.key,
        ...input,
      })
      onFinished(conversationId)
    } catch (error) {
      toast.error({ title: errorMessage(error, t('onboarding.confirmError')) })
      if (isApiErrorCode(error, 'AI_ONBOARDING_DONE')) onFinished(null)
    }
  }

  const skipButton = (
    <Button disabled={busy} onClick={() => void leave()}>
      {t('onboarding.skip')}
    </Button>
  )
  const manualButton = (
    <Button disabled={busy} onClick={() => setManual(true)}>
      {t('onboarding.fillIn')}
    </Button>
  )

  if (onboarding.isPending || state === 'done')
    return (
      <div className="flex justify-center py-24">
        <Spin size="lg" />
      </div>
    )
  if (onboarding.isError)
    return (
      <div className="p-6 pt-12">
        <SectionError
          title={t('onboarding.loadError')}
          retryLabel={t('progress.tryAgain')}
          onRetry={() => void onboarding.refetch()}
        />
      </div>
    )

  if (showForm) {
    const heading = suggestion ? 'suggested' : state === 'few_posts' ? 'fewPosts' : 'manual'
    return (
      <div className="flex max-h-[80vh] flex-col">
        <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pt-12 pb-4">
          <h2 className="text-heading-2 text-text-primary">{t(`onboarding.${heading}Title`)}</h2>
          <p className="mt-1 mb-4 text-body-md text-text-secondary">
            {t(`onboarding.${heading}Description`)}
          </p>
          <ProfileForm
            form={form}
            profile={suggestion ? { ...EMPTY_PROFILE, ...suggestion } : EMPTY_PROFILE}
            onFinish={(values) => void submit(values)}
          />
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-border-subtle px-6 py-4">
          {skipButton}
          <Button variant="primary" loading={confirm.isPending} onClick={() => form.submit()}>
            {t('onboarding.confirm')}
          </Button>
        </div>
      </div>
    )
  }

  if (state === 'syncing')
    return (
      <Message
        icon={<Spin size="lg" />}
        title={t('onboarding.syncingTitle')}
        description={t('onboarding.syncingDescription')}
      >
        {manualButton}
        {skipButton}
      </Message>
    )

  return (
    <Message
      icon={<AiMark className="w-[56px]" />}
      title={t('onboarding.readyTitle')}
      description={t('onboarding.readyDescription')}
    >
      {skipButton}
      {manualButton}
      <Button variant="primary" loading={suggest.isPending} onClick={() => void read()}>
        {t('onboarding.read')}
      </Button>
    </Message>
  )
}

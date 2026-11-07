import { useTranslation } from 'react-i18next'
import { CodedError } from '@/shared/api/errors'
import { useApiErrorMessage } from '@/shared/hooks'
import { Alert, Button, IconCheck, SectionError, Spin } from '@/shared/ui'
import { useAiGeneration, type AiGenerationPhase } from '../api'

const STEPS: Exclude<AiGenerationPhase, 'queued'>[] = ['writing', 'image', 'checking', 'saving']

export function AiGenerationProgress({
  brandId,
  generationId,
  autoSubmit,
  onOpen,
  onRetry,
  onClose,
}: {
  brandId: string
  generationId: string
  autoSubmit: boolean
  onOpen: (contentId: string) => void
  onRetry: () => void
  onClose: () => void
}) {
  const { t } = useTranslation('aiContent')
  const errorMessage = useApiErrorMessage('aiContent')
  const generation = useAiGeneration(brandId, generationId)
  const data = generation.data

  if (generation.isError)
    return (
      <SectionError
        title={t('progress.loadError')}
        retryLabel={t('progress.tryAgain')}
        onRetry={() => void generation.refetch()}
      />
    )

  if (data?.status === 'failed')
    return (
      <div className="mt-4 grid gap-4">
        <Alert
          variant="soft"
          tone="error"
          title={t('progress.failedTitle')}
          description={errorMessage(
            new CodedError(data.errorCode ?? 'UNKNOWN'),
            t('progress.failed'),
          )}
        />
        <div className="flex justify-end gap-3">
          <Button onClick={onClose}>{t('modal.close')}</Button>
          <Button variant="primary" onClick={onRetry}>
            {t('progress.tryAgain')}
          </Button>
        </div>
      </div>
    )

  if (data?.status === 'succeeded' && data.contentId) {
    const contentId = data.contentId
    return (
      <div className="mt-4 grid gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-success-500 bg-success-50 p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-500 text-text-inverse">
            <IconCheck aria-hidden />
          </span>
          <div>
            <p className="text-label-md text-text-primary">{t('progress.doneTitle')}</p>
            <p className="text-body-sm text-text-secondary">
              {t(autoSubmit ? 'progress.submittedDescription' : 'progress.doneDescription')}
            </p>
          </div>
        </div>
        {data.imageErrorCode ? (
          <Alert variant="soft" tone="warning" title={t('progress.imageMissing')} />
        ) : null}
        <div className="flex justify-end gap-3">
          <Button onClick={onClose}>{t('modal.close')}</Button>
          <Button variant="primary" onClick={() => onOpen(contentId)}>
            {t('progress.open')}
          </Button>
        </div>
      </div>
    )
  }

  const phase = data?.phase ?? 'queued'
  const steps = STEPS.filter((step) => step !== 'image' || data?.wantsImage)
  const current = phase === 'queued' ? -1 : steps.indexOf(phase)

  return (
    <div className="mt-4 grid gap-4">
      <ol className="grid gap-1" aria-live="polite">
        {phase === 'queued' ? (
          <li className="flex items-center gap-3 rounded-lg bg-bg-surface-subtle px-3 py-2">
            <Spin size="sm" />
            <span className="text-label-md text-text-primary">{t('progress.queued')}</span>
          </li>
        ) : null}
        {steps.map((step, index) => {
          const done = index < current
          const active = index === current
          return (
            <li
              key={step}
              aria-current={active ? 'step' : undefined}
              className={
                'flex items-center gap-3 rounded-lg px-3 py-2 ' +
                (active ? 'bg-bg-surface-subtle' : '')
              }
            >
              <span className="flex size-6 shrink-0 items-center justify-center">
                {done ? (
                  <IconCheck aria-hidden className="text-success-500" />
                ) : active ? (
                  <Spin size="sm" />
                ) : (
                  <span aria-hidden className="size-2 rounded-full bg-neutral-300" />
                )}
              </span>
              <span
                className={
                  'text-body-sm ' +
                  (active
                    ? 'text-label-md text-text-primary'
                    : done
                      ? 'text-text-secondary'
                      : 'text-text-tertiary')
                }
              >
                {t(`progress.${step}`)}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="text-body-sm text-text-tertiary">{t('progress.canClose')}</p>
      <div className="flex justify-end">
        <Button onClick={onClose}>{t('modal.close')}</Button>
      </div>
    </div>
  )
}

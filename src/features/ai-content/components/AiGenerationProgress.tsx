import { useTranslation } from 'react-i18next'
import { IconCheck, Spin } from '@/shared/ui'
import type { AiGeneration, AiGenerationPhase } from '../api'

const STEPS: Exclude<AiGenerationPhase, 'queued'>[] = ['writing', 'image', 'checking', 'saving']

/** The steps of a turn still being made. Saving only happens when it is sent for approval. */
export function AiGenerationProgress({ turn }: { turn: AiGeneration }) {
  const { t } = useTranslation('aiContent')
  const phase = turn.phase ?? 'queued'
  const steps = STEPS.filter(
    (step) => (step !== 'image' || turn.wantsImage) && (step !== 'saving' || turn.autoSubmit),
  )
  const current = phase === 'queued' ? -1 : steps.indexOf(phase)

  return (
    <div className="grid gap-2">
      <ol className="grid gap-1" aria-live="polite" aria-label={t('progress.title')}>
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
                  active
                    ? 'text-label-md text-text-primary'
                    : done
                      ? 'text-body-sm text-text-secondary'
                      : 'text-body-sm text-text-tertiary'
                }
              >
                {t(`progress.${step}`)}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="text-caption text-text-tertiary">{t('progress.canClose')}</p>
    </div>
  )
}

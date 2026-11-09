import { useTranslation } from 'react-i18next'
import { IconCheck, IconShieldCheck, Spin } from '@/shared/ui'
import type { AiGeneration, AiGenerationPhase } from '../api'

type Step = Exclude<AiGenerationPhase, 'queued'>

const STEPS: Step[] = ['writing', 'image', 'checking', 'finishing']

/**
 * The steps of a turn still being made, with a bar that keeps moving while it waits. The image
 * step shows only once the AI has chosen to make one. While queued no step is under way yet.
 */
export function AiGenerationProgress({ turn }: { turn: AiGeneration }) {
  const { t } = useTranslation('aiContent')
  const phase = turn.phase ?? 'queued'
  const makesImage = turn.imageAction === 'generate' || phase === 'image'
  const steps = STEPS.filter((step) => step !== 'image' || makesImage)
  const current = phase === 'queued' ? -1 : steps.indexOf(phase)
  // An edit only changes the words, so its first step reads as such.
  const label = (step: Step) => (step === 'writing' && turn.kind === 'edit' ? 'editing' : step)

  return (
    <div className="grid gap-4">
      <div className="grid gap-5 rounded-xl border border-ai-100 bg-ai-50 p-5">
        <ol className="grid" aria-live="polite" aria-label={t('progress.title')}>
          {steps.map((step, index) => {
            const done = index < current
            const active = index === current
            return (
              <li
                key={step}
                aria-current={active ? 'step' : undefined}
                className="relative flex items-center gap-3 pb-4 last:pb-0"
              >
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute start-[11px] top-6 bottom-0 w-px bg-border"
                  />
                ) : null}
                <span className="flex size-6 shrink-0 items-center justify-center">
                  {done ? (
                    <IconCheck aria-hidden className="text-success-500 opacity-60" />
                  ) : active ? (
                    <Spin size="sm" />
                  ) : (
                    <span aria-hidden className="size-2 rounded-full bg-neutral-300" />
                  )}
                </span>
                <span
                  className={
                    active
                      ? 'text-label-md font-semibold text-text-primary'
                      : done
                        ? 'text-body-sm text-text-tertiary'
                        : 'text-body-sm text-text-secondary'
                  }
                >
                  {t(`progress.${active ? 'running' : 'steps'}.${label(step)}`)}
                </span>
              </li>
            )
          })}
        </ol>
        <div aria-hidden className="relative h-[6px] overflow-hidden rounded-full bg-ai-100">
          <span className="ai-progress-sweep" />
        </div>
      </div>
      <p className="flex items-center gap-2 text-body-sm text-text-secondary">
        <IconShieldCheck aria-hidden className="shrink-0 text-icon-md text-success-500" />
        {t('progress.canClose')}
      </p>
    </div>
  )
}

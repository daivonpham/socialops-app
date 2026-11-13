import { useTranslation } from 'react-i18next'
import aiLoader from '@/assets/ai/ai-response-loader.svg'
import type { AiGeneration } from '../api'

/** The AI loader beside what it is doing now, in place of the answer still to come. */
export function AiWorking({ label }: { label: string }) {
  return (
    <p aria-live="polite" className="flex items-center gap-2 text-body-sm">
      <img src={aiLoader} alt="" aria-hidden className="size-6 shrink-0" />
      <span className="ai-shimmer-text">{label}</span>
    </p>
  )
}

/** What a turn still being made is doing: one line for the step under way, or the wait for a slot. */
export function AiGenerationProgress({ turn }: { turn: AiGeneration }) {
  const { t } = useTranslation('aiContent')
  const phase = turn.phase ?? 'queued'
  if (phase === 'queued') return <AiWorking label={t('progress.queued')} />
  // An edit only changes the words, so its writing reads as such.
  const step = phase === 'writing' && turn.kind === 'edit' ? 'editing' : phase
  return <AiWorking label={t(`progress.running.${step}`)} />
}

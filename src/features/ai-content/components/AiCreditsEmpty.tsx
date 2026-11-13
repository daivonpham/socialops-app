import { useTranslation } from 'react-i18next'
import assistantRobot from '@/assets/ai/assistant-robot.svg'
import { IconCalendar } from '@/shared/ui'

/**
 * Shown instead of an error when the month's Credits are gone: nothing is broken, the assistant is
 * only resting until they renew. The robot's battery says so before the words do.
 */
export function AiCreditsEmpty({
  whose,
  resetDate,
}: {
  whose: 'workspace' | 'member'
  resetDate: string
}) {
  const { t } = useTranslation('aiContent')
  return (
    <div
      role="alert"
      className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-ai-200 bg-linear-to-r from-ai-100 via-ai-50 to-bg-surface px-4 py-3"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -end-8 -top-16 size-[160px] rounded-full bg-ai-200/50 blur-2xl"
      />
      <span aria-hidden className="relative shrink-0">
        <img src={assistantRobot} alt="" className="h-auto w-[64px]" />
        <span className="absolute -end-1 bottom-0 flex items-center">
          <span className="flex h-[14px] w-[26px] items-center rounded-sm border border-ai-400 bg-bg-surface p-px shadow-xs">
            <span className="h-full w-1 rounded-xs bg-error-500 motion-safe:animate-pulse" />
          </span>
          <span className="h-[6px] w-[2px] rounded-e-xs bg-ai-400" />
        </span>
      </span>
      <div className="relative min-w-0 flex-1">
        <p className="text-label-md font-semibold text-text-primary">
          {t(`credits.empty.${whose}.title`)}
        </p>
        <p className="mt-1 text-body-sm text-text-secondary">
          {t(`credits.empty.${whose}.description`)}
        </p>
      </div>
      <span className="relative hidden shrink-0 items-center gap-2 rounded-full border border-ai-200 bg-bg-surface px-3 py-1 text-label-sm text-ai-700 shadow-xs sm:inline-flex">
        <IconCalendar aria-hidden />
        {t('credits.empty.renews', { date: resetDate })}
      </span>
    </div>
  )
}

import { AiMark } from './AiMark'

/** The mark every AI surface shares, so customers learn to recognise it. */
export function AiBadgeIcon() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-ai-400 to-ai-600 shadow-xs">
      <AiMark tone="white" className="w-[24px]" />
    </span>
  )
}

import aiMarkPurple from '@/assets/ai/icon-ai-tim.svg'
import aiMarkWhite from '@/assets/ai/icon-ai-trang.svg'

/** The AI sparkle shared by every AI surface: white on the gradient, purple on light ground. */
export function AiMark({
  tone = 'purple',
  className,
}: {
  tone?: 'purple' | 'white'
  className?: string
}) {
  return (
    <img
      src={tone === 'white' ? aiMarkWhite : aiMarkPurple}
      alt=""
      aria-hidden
      className={'h-auto shrink-0 ' + (className ?? '')}
    />
  )
}

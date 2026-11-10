export type SpinProps = {
  size?: 'sm' | 'md' | 'lg'
  /** Colour: the brand by default, AI purple for work the AI is doing. */
  tone?: 'brand' | 'ai'
  /** Shape: Ant's four dots by default, or a turning ring. */
  indicator?: 'dots' | 'ring'
  className?: string
}

export { Spin } from '@/shared/components/ant/Spin'

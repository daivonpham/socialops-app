export type SwitchProps = {
  checked?: boolean
  disabled?: boolean
  size?: 'default' | 'small'
  onChange?: (checked: boolean) => void
  /** `ai` paints the on state in the AI purple; only for AI surfaces. */
  tone?: 'brand' | 'ai'
  className?: string
  'aria-label'?: string
}

export { Switch } from '@/shared/components/ant/Switch'

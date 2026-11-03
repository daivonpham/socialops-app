export type ProgressProps = {
  percent: number
  ariaLabel: string
  /** `primary` by default; `soft` and `muted` rank secondary rows below the leader. */
  tone?: 'primary' | 'soft' | 'muted'
}
export { Progress } from '@/shared/components/ant/Progress'

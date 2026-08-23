import type { ReactNode } from 'react'

export type StatisticProps = {
  title: ReactNode
  value: string | number
  suffix?: ReactNode
  prefix?: ReactNode
}
export { Statistic } from '@/shared/components/ant/Statistic'

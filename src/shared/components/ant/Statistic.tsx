import { Statistic as AntStatistic } from 'antd'
import type { StatisticProps } from '@/shared/ui/primitives/Statistic'

export function Statistic(props: StatisticProps) {
  return <AntStatistic {...props} />
}

import { Card as AntCard } from 'antd'
import type { CardProps } from '@/shared/ui/primitives/Card'

export function Card(props: CardProps) {
  return <AntCard {...props} />
}

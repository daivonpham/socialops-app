import type { ReactNode } from 'react'

export type CardBackground = 'gray' | 'white'

export type CardProps = {
  title?: ReactNode
  extra?: ReactNode
  children: ReactNode
  className?: string
  background?: CardBackground
}
export { Card } from '@/shared/components/ant/Card'

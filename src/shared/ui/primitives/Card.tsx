import type { ReactNode } from 'react'

export type CardProps = {
  title?: ReactNode
  extra?: ReactNode
  children: ReactNode
  className?: string
}
export { Card } from '@/shared/components/ant/Card'

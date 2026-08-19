import type { ReactElement, ReactNode } from 'react'

export type TooltipProps = {
  title: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactElement
}

export { Tooltip } from '@/shared/components/ant/Tooltip'

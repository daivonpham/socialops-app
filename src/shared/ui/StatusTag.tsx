import type { ReactNode } from 'react'

export type StatusTone = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'brand'
export type StatusTagProps = { children: ReactNode; tone?: StatusTone }

export { StatusTag } from '@/shared/components/ant/StatusTag'

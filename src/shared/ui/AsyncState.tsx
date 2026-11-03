import type { ReactNode } from 'react'

export type SectionSkeletonProps = { rows?: number }
export type SectionErrorProps = { title: string; retryLabel: string; onRetry: () => void }
export type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export { EmptyState, SectionError, SectionSkeleton } from '@/shared/components/ant/AsyncState'

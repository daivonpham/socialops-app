import { Button, Empty, Result, Skeleton } from 'antd'
import type {
  EmptyStateProps,
  SectionErrorProps,
  SectionSkeletonProps,
} from '@/shared/ui/AsyncState'

export function SectionSkeleton({ rows = 3 }: SectionSkeletonProps) {
  return <Skeleton active paragraph={{ rows }} title />
}

export function SectionError({ title, retryLabel, onRetry }: SectionErrorProps) {
  return (
    <Result status="error" title={title} extra={<Button onClick={onRetry}>{retryLabel}</Button>} />
  )
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Empty
      image={icon ?? Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div>
          <h3 className="text-heading-4 text-text-primary">{title}</h3>
          <p className="mt-1 text-body-sm text-text-tertiary">{description}</p>
        </div>
      }
    >
      {action}
    </Empty>
  )
}

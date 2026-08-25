import { Card as AntCard } from 'antd'
import { color, radius, semanticColor, space } from '@/shared/styles/tokens'
import type { CardProps } from '@/shared/ui/primitives/Card'

export function Card({ title, extra, children, className, background = 'gray' }: CardProps) {
  const backgroundColor = background === 'white' ? color.neutral[0] : color.neutral[50]

  return (
    <AntCard
      title={
        title ? (
          <div className="text-heading-3 font-semibold text-text-primary">{title}</div>
        ) : undefined
      }
      extra={extra}
      className={className}
      style={{ borderColor: semanticColor.border.subtle, overflow: 'hidden' }}
      styles={{
        header: {
          background: backgroundColor,
          borderBottom: `1px solid ${semanticColor.border.subtle}`,
          padding: `${space[4]}px ${space[5]}px`,
          borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
        },
        body: {
          padding: 0,
          width: 'calc(100% + 2px)',
          marginInlineStart: '-1px',
          marginBottom: '-1px',
          border: 'none',
        },
      }}
    >
      {children}
    </AntCard>
  )
}

import { Avatar as AntAvatar } from 'antd'
import { avatarSize } from '@/shared/styles/tokens'
import type { AvatarProps } from '@/shared/ui/Avatar'

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <AntAvatar
      src={src}
      alt={name}
      size={avatarSize[size]}
      className={`shrink-0 border border-border-subtle bg-bg-surface-subtle text-text-tertiary ${className ?? ''}`}
    >
      {initialsOf(name)}
    </AntAvatar>
  )
}

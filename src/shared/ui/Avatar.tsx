/** Platform-owned avatar API (design.md §18) — implemented by the active adapter. */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type AvatarProps = {
  /** Used for initials and the accessible label. */
  name: string
  src?: string
  size?: AvatarSize
  className?: string
}

export { Avatar } from '@/shared/components/ant/Avatar'

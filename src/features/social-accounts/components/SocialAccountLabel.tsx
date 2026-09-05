import { Avatar } from '@/shared/ui'

export type SocialAccountLabelProps = {
  name: string
  avatarUrl?: string
  className?: string
}

export function SocialAccountLabel({ name, avatarUrl, className }: SocialAccountLabelProps) {
  return (
    <span className={`flex min-w-0 items-center gap-2 ${className ?? ''}`}>
      <Avatar name={name} src={avatarUrl} size="xs" />
      <span className="min-w-0 flex-1 truncate text-start">{name}</span>
    </span>
  )
}

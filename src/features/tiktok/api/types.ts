export type TikTokAccountDto = {
  id: string
  providerAccountId: string
  name: string
  status: string
  avatarUrl?: string
  connectedAt?: string
}

export type TikTokIntegrationDto = {
  state: 'connected' | 'disconnected'
  accounts: TikTokAccountDto[]
}

export type TikTokCreatorInfoDto = {
  accountId: string
  privacyLevelOptions: Array<
    'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY'
  >
  commentDisabled: boolean
  duetDisabled: boolean
  stitchDisabled: boolean
  maxVideoPostDurationSec: number
}

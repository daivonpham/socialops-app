export const PLATFORMS = ['facebook', 'tiktok'] as const
export type Platform = (typeof PLATFORMS)[number]

/** Connected-account counts per platform for one brand. */
export type SocialAccountCounts = Record<Platform, number>

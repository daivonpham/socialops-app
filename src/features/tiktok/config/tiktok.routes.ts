/** Paths of the TikTok screens; the app router registers them from here. */
export const TIKTOK_ROUTES = {
  OVERVIEW: '/platforms/tiktok/overview',
  VIDEO_DETAIL: '/platforms/tiktok/overview/videos/:videoId',
} as const

export const tiktokVideoDetailPath = (videoId: string): string =>
  TIKTOK_ROUTES.VIDEO_DETAIL.replace(':videoId', encodeURIComponent(videoId))

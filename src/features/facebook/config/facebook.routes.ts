/** Paths of the Facebook screens; the app router registers them from here. */
export const FACEBOOK_ROUTES = {
  OVERVIEW: '/platforms/facebook/overview',
  POST_DETAIL: '/platforms/facebook/overview/posts/:postId',
} as const

export const facebookPostDetailPath = (postId: string): string =>
  FACEBOOK_ROUTES.POST_DETAIL.replace(':postId', encodeURIComponent(postId))

/** Public legal pages; Meta and Google link here, so the paths must stay stable. */
export const LEGAL_ROUTES = {
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const

/** Who runs SocialOps and how to reach them, printed on both legal pages. */
export const LEGAL_CONTACT = {
  operator: 'Phạm Quang Đại',
  email: 'tecodev.info@gmail.com',
  phone: '+84 966 822 614',
} as const

/** Bump when the text of either page changes. */
export const LEGAL_UPDATED_AT = '2026-11-19'

export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/password-reset',
  VERIFY_EMAIL: '/auth/email-verification',
  GOOGLE_CALLBACK: '/auth/google/callback',
  CHANGE_PASSWORD: '/auth/change-password',
  POST_AUTH: '/',
} as const

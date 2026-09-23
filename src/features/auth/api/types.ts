export type AuthUserDto = {
  id: string
  email: string
  displayName: string
  locale: 'vi' | 'en'
  avatarUrl: string | null
}
export type SessionDto = { accessToken: string; expiresIn: string; user: AuthUserDto }

export type LoginInput = { email: string; password: string }
export type RegisterInput = {
  email: string
  displayName: string
  password: string
  locale?: string
}
export type RegisterResult = {
  userId: string
  workspaceId: string
  verificationRequired: boolean
}
export type TokenInput = { token: string }
export type ForgotPasswordInput = { email: string }
export type ResetPasswordInput = TokenInput & { password: string }
export type ChangePasswordInput = { currentPassword: string; newPassword: string }
export type MessageResult = { message: string }
export type GoogleStartResult = { authorizationUrl: string }

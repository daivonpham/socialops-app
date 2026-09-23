import { apiClient, refreshAccessToken, setAccessToken } from '@/shared/api/client'
import type { CommonApiResponse } from '@/shared/api/types'
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  GoogleStartResult,
  LoginInput,
  MessageResult,
  RegisterInput,
  RegisterResult,
  ResetPasswordInput,
  SessionDto,
  TokenInput,
} from './types'

const AUTH_ENDPOINT = '/auth'

export async function login(input: LoginInput) {
  const { data } = await apiClient.post<CommonApiResponse<SessionDto>>(
    `${AUTH_ENDPOINT}/login`,
    input,
  )
  return data.data
}

export async function register(input: RegisterInput) {
  const { data } = await apiClient.post<CommonApiResponse<RegisterResult>>(
    `${AUTH_ENDPOINT}/register`,
    input,
  )
  return data.data
}

export async function verifyEmail(input: TokenInput) {
  const { data } = await apiClient.post<CommonApiResponse<MessageResult>>(
    `${AUTH_ENDPOINT}/verify-email`,
    input,
  )
  return data.data
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const { data } = await apiClient.post<CommonApiResponse<MessageResult>>(
    `${AUTH_ENDPOINT}/forgot-password`,
    input,
  )
  return data.data
}

export async function resetPassword(input: ResetPasswordInput) {
  const { data } = await apiClient.post<CommonApiResponse<MessageResult>>(
    `${AUTH_ENDPOINT}/reset-password`,
    input,
  )
  return data.data
}

export async function changePassword(input: ChangePasswordInput) {
  const { data } = await apiClient.post<CommonApiResponse<MessageResult>>(
    `${AUTH_ENDPOINT}/change-password`,
    input,
  )
  return data.data
}

export async function startGoogleAuth() {
  const { data } = await apiClient.get<CommonApiResponse<GoogleStartResult>>(
    `${AUTH_ENDPOINT}/google`,
    { params: { locale: document.documentElement.lang.startsWith('vi') ? 'vi' : 'en' } },
  )
  return data.data
}

export async function restoreSession() {
  return refreshAccessToken()
}

export async function logout() {
  try {
    await apiClient.post(`${AUTH_ENDPOINT}/logout`, {})
  } finally {
    setAccessToken(null)
  }
}

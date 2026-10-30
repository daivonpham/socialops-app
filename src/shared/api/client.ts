import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { CommonApiResponse } from './types'

type RetryableConfig = InternalAxiosRequestConfig & { _authRetry?: boolean }
type SessionDto = {
  accessToken: string
  expiresIn: string
  user: {
    id: string
    email: string
    displayName: string
    locale: 'vi' | 'en'
    avatarUrl: string | null
    brandOnboardingCompleted: boolean
    hasPassword: boolean
  }
}

let accessToken: string | null = null
let refreshPromise: Promise<SessionDto> | null = null
let sessionExpiredHandler: (() => void) | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function onSessionExpired(handler: (() => void) | null) {
  sessionExpiredHandler = handler
}

/** Single HTTP client for every feature service. Base URL comes from env only. */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})

const sessionClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})

export async function refreshAccessToken() {
  refreshPromise ??= sessionClient
    .post<CommonApiResponse<SessionDto>>('/auth/refresh', {})
    .then(({ data }) => {
      setAccessToken(data.data.accessToken)
      return data.data
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

apiClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetryableConfig | undefined
  const isAuthEndpoint = config?.url?.startsWith('/auth/') ?? false
  if (error.response?.status !== 401 || !config || config._authRetry || isAuthEndpoint) {
    return Promise.reject(error)
  }
  config._authRetry = true
  try {
    const session = await refreshAccessToken()
    config.headers.Authorization = `Bearer ${session.accessToken}`
    return apiClient(config)
  } catch (refreshError) {
    setAccessToken(null)
    sessionExpiredHandler?.()
    return Promise.reject(refreshError)
  }
})

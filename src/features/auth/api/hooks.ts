import { useMutation } from '@tanstack/react-query'
import {
  changePassword,
  forgotPassword,
  login,
  register,
  resetPassword,
  startGoogleAuth,
  verifyEmail,
} from './service'

export const AUTH_QUERY_KEYS = { all: ['auth'] as const }

export const useLogin = () => useMutation({ mutationFn: login })
export const useRegister = () => useMutation({ mutationFn: register })
export const useVerifyEmail = () => useMutation({ mutationFn: verifyEmail })
export const useForgotPassword = () => useMutation({ mutationFn: forgotPassword })
export const useResetPassword = () => useMutation({ mutationFn: resetPassword })
export const useChangePassword = () => useMutation({ mutationFn: changePassword })
export const useStartGoogleAuth = () => useMutation({ mutationFn: startGoogleAuth })

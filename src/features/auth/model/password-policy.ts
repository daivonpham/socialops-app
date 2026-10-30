import { useTranslation } from 'react-i18next'
import type { FormRule } from '@/shared/ui'

/** Mirrors the API password policy; every new-password field uses these limits. */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

export function useNewPasswordRules(): FormRule[] {
  const { t } = useTranslation('auth')
  return [
    { required: true, message: t('validation.passwordRequired') },
    {
      min: PASSWORD_MIN_LENGTH,
      message: t('validation.passwordMin', { min: PASSWORD_MIN_LENGTH }),
    },
    {
      max: PASSWORD_MAX_LENGTH,
      message: t('validation.passwordMax', { max: PASSWORD_MAX_LENGTH }),
    },
  ]
}

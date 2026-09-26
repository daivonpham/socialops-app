import { Link } from 'react-router-dom'
import { GoArrowLeft } from 'react-icons/go'
import { useTranslation } from 'react-i18next'
import { AUTH_ROUTES } from '../config/auth.routes'

export function BackToLoginLink() {
  const { t } = useTranslation('auth')

  return (
    <Link
      className="inline-flex items-center gap-2 font-semibold text-text-secondary hover:text-text-primary"
      to={AUTH_ROUTES.LOGIN}
    >
      <GoArrowLeft aria-hidden className="text-icon-md" />
      {t('common.backToLogin')}
    </Link>
  )
}

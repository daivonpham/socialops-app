import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { LEGAL_ROUTES } from '@/features/privacy'

const linkClass = 'text-text-secondary underline underline-offset-2 hover:text-text-primary'

/** "By continuing, you agree to…" line under the sign-in and sign-up forms. */
export function LegalConsent() {
  return (
    <p className="text-center text-body-sm text-text-tertiary">
      <Trans
        ns="auth"
        i18nKey="legal.consent"
        components={{
          terms: <Link to={LEGAL_ROUTES.TERMS} className={linkClass} />,
          privacy: <Link to={LEGAL_ROUTES.PRIVACY} className={linkClass} />,
        }}
      />
    </p>
  )
}

import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'

const MUSIC_USAGE_URL = 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en'
const BRANDED_CONTENT_URL = 'https://www.tiktok.com/legal/page/global/bc-policy/en'

/**
 * TikTok's terms the person agrees to by sending a post to TikTok: the Music Usage Confirmation,
 * and the Branded Content Policy for branded content. TikTok wants this right before the action
 * that sends the post, whoever takes it: the author posting, or an approver approving.
 */
export function TikTokTermsConsent({ branded }: { branded: boolean }) {
  const { t } = useTranslation('planning')
  return (
    <Trans
      t={t}
      i18nKey={branded ? 'composer.tiktok.consentBranded' : 'composer.tiktok.consentMusic'}
      components={{
        music: <TermsLink href={MUSIC_USAGE_URL} />,
        branded: <TermsLink href={BRANDED_CONTENT_URL} />,
      }}
    />
  )
}

function TermsLink({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-link hover:text-link-hover"
    >
      {children}
    </a>
  )
}

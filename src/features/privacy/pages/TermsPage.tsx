import { useTranslation } from 'react-i18next'
import { LegalDocument } from '../components/LegalDocument'
import { LEGAL_CONTACT } from '../config/legal'

const SECTIONS = [
  'acceptance',
  'service',
  'accounts',
  'connectedPlatforms',
  'content',
  'ai',
  'acceptableUse',
  'availability',
  'liability',
  'termination',
  'changes',
  'law',
] as const

/** Public Terms of Service, linked from the sign-in pages. */
export default function TermsPage() {
  const { t } = useTranslation('privacy')
  const values = {
    operator: LEGAL_CONTACT.operator,
    email: LEGAL_CONTACT.email,
    phone: LEGAL_CONTACT.phone,
  }

  return (
    <LegalDocument
      title={t('terms.title')}
      intro={t('terms.intro', values)}
      sections={SECTIONS.map((id) => ({
        id,
        title: t(`terms.sections.${id}.title`),
        body: t(`terms.sections.${id}.body`, values),
      }))}
    />
  )
}

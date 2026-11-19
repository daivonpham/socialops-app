import { useTranslation } from 'react-i18next'
import { LegalDocument } from '../components/LegalDocument'
import { LEGAL_CONTACT } from '../config/legal'

const SECTIONS = [
  'controller',
  'dataCollected',
  'facebookData',
  'otherIntegrations',
  'use',
  'sharing',
  'retention',
  'deletion',
  'rights',
  'security',
  'storage',
  'children',
  'changes',
] as const

/** Public Privacy Policy, linked from the sign-in pages and from the Meta and Google apps. */
export default function PrivacyPolicyPage() {
  const { t } = useTranslation('privacy')
  const values = {
    operator: LEGAL_CONTACT.operator,
    email: LEGAL_CONTACT.email,
    phone: LEGAL_CONTACT.phone,
  }

  return (
    <LegalDocument
      title={t('privacyPolicy.title')}
      intro={t('privacyPolicy.intro', values)}
      sections={SECTIONS.map((id) => ({
        id,
        title: t(`privacyPolicy.sections.${id}.title`),
        body: t(`privacyPolicy.sections.${id}.body`, values),
      }))}
    />
  )
}

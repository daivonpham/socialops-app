/** Webmail inbox for well-known providers; `null` when the provider is unknown. */
export function getInboxUrl(email: string | undefined) {
  const domain = email?.split('@')[1]?.toLowerCase()

  if (domain === 'gmail.com' || domain === 'googlemail.com') return 'https://mail.google.com/'
  if (domain && ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) {
    return 'https://outlook.live.com/mail/'
  }
  if (domain === 'yahoo.com') return 'https://mail.yahoo.com/'
  if (domain && ['icloud.com', 'me.com', 'mac.com'].includes(domain)) {
    return 'https://www.icloud.com/mail/'
  }
  if (domain === 'proton.me' || domain === 'protonmail.com') return 'https://mail.proton.me/'
  if (domain === 'zoho.com') return 'https://mail.zoho.com/'

  return null
}

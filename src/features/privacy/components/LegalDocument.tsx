import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/shared/i18n'
import { AUTH_ROUTES } from '@/features/auth'
import { Button, LocaleSwitcher, Logo } from '@/shared/ui'
import { LEGAL_CONTACT, LEGAL_ROUTES, LEGAL_UPDATED_AT } from '../config/legal'

export type LegalSection = { id: string; title: string; body: string }

/**
 * Splits a section body into paragraphs and bullet lists: blocks are separated by a blank
 * line, and lines starting with "- " are list items.
 */
function toBlocks(body: string) {
  return body.split(/\n\s*\n/).map((block) => {
    const lines = block.split('\n').map((line) => line.trim())
    return lines.every((line) => line.startsWith('- '))
      ? { type: 'list' as const, items: lines.map((line) => line.slice(2)) }
      : { type: 'paragraph' as const, text: lines.join(' ') }
  })
}

/** The section nearest the top of the screen, to highlight it in the contents. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const first = ids.find((id) => visible.has(id))
        if (first) setActive(first)
      },
      // Below the fixed header, upper part of the screen only.
      { rootMargin: '-96px 0px -60% 0px' },
    )
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [ids])

  return active
}

/** Public, sign-in-free page for the Terms of Service and the Privacy Policy. */
export function LegalDocument({
  title,
  intro,
  sections,
}: {
  title: string
  intro: string
  sections: LegalSection[]
}) {
  const { t, i18n } = useTranslation('privacy')
  const navigate = useNavigate()
  const [ids] = useState(() => sections.map((section) => section.id))
  const active = useActiveSection(ids)

  const pageLinks = [
    { to: LEGAL_ROUTES.TERMS, label: t('terms.title') },
    { to: LEGAL_ROUTES.PRIVACY, label: t('privacyPolicy.title') },
  ].map((page) => (
    <NavLink
      key={page.to}
      to={page.to}
      className={({ isActive }) =>
        `-mb-px flex items-center border-b-2 py-3 text-label-md outline-none focus-visible:focus-ring ${
          isActive
            ? 'border-brand-600 text-brand-700'
            : 'border-transparent text-text-secondary hover:text-text-primary'
        }`
      }
    >
      {page.label}
    </NavLink>
  ))

  const contents = (
    <ol className="grid gap-1 text-body-sm">
      {sections.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            aria-current={active === section.id ? 'location' : undefined}
            className={`flex gap-2 rounded-md px-3 py-2 outline-none focus-visible:focus-ring ${
              active === section.id
                ? 'bg-brand-50 font-semibold text-brand-700'
                : 'text-text-secondary hover:bg-bg-surface-subtle hover:text-text-primary'
            }`}
          >
            <span className="shrink-0 tabular-nums">{index + 1}.</span>
            <span>{section.title}</span>
          </a>
        </li>
      ))}
    </ol>
  )

  return (
    <div className="min-h-screen bg-bg-page pt-16">
      <header className="fixed inset-x-0 top-0 z-header h-16 border-b border-border-subtle bg-bg-surface">
        <div className="mx-auto flex h-full max-w-[1120px] items-center gap-4 px-4 sm:px-6 lg:gap-8">
          <Link
            to="/"
            aria-label={t('legal.home')}
            className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:focus-ring"
          >
            <Logo size="md" />
            <span className="text-heading-4 text-text-primary">SocialOps</span>
          </Link>
          <nav aria-label={t('legal.pages')} className="hidden h-full items-stretch gap-6 md:flex">
            {pageLinks}
          </nav>
          <div className="ms-auto flex shrink-0 items-center gap-2">
            <LocaleSwitcher compact />
            <Button variant="primary" size="sm" onClick={() => navigate(AUTH_ROUTES.LOGIN)}>
              {t('legal.login')}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1120px] gap-12 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[256px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav
            aria-label={t('legal.contents')}
            className="sticky top-24 max-h-[calc(100vh-128px)] overflow-y-auto"
          >
            <p className="px-3 pb-2 text-label-sm text-text-tertiary">{t('legal.contents')}</p>
            {contents}
          </nav>
        </aside>

        <main className="min-w-0 max-w-narrow">
          <nav
            aria-label={t('legal.pages')}
            className="-mt-4 mb-8 flex gap-6 border-b border-border-subtle md:hidden"
          >
            {pageLinks}
          </nav>
          <article aria-labelledby="legal-title">
            <h1 id="legal-title" className="text-heading-1 text-text-primary">
              {title}
            </h1>
            <p className="mt-2 text-body-sm text-text-tertiary">
              {t('legal.updatedAt', { date: formatDate(LEGAL_UPDATED_AT, i18n.resolvedLanguage) })}
            </p>
            <p className="mt-6 text-body-md text-text-secondary">{intro}</p>

            <nav
              aria-label={t('legal.contents')}
              className="mt-8 rounded-xl border border-border-subtle bg-bg-surface p-3 lg:hidden"
            >
              <p className="px-3 pb-2 pt-1 text-label-sm text-text-tertiary">
                {t('legal.contents')}
              </p>
              {contents}
            </nav>

            <div className="mt-10 grid gap-10">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-heading-3 text-text-primary">
                    {index + 1}. {section.title}
                  </h2>
                  <div className="mt-3 grid gap-3 text-body-md text-text-secondary">
                    {toBlocks(section.body).map((block, blockIndex) =>
                      block.type === 'list' ? (
                        <ul key={blockIndex} className="grid list-disc gap-2 ps-5">
                          {block.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p key={blockIndex}>{block.text}</p>
                      ),
                    )}
                  </div>
                </section>
              ))}
            </div>

            <section className="mt-10 rounded-xl border border-border-subtle bg-bg-surface p-5">
              <h2 className="text-label-md text-text-primary">{t('legal.contactTitle')}</h2>
              <p className="mt-2 text-body-sm text-text-secondary">
                {t('legal.contactBody', { operator: LEGAL_CONTACT.operator })}
              </p>
              <dl className="mt-3 grid gap-2 text-body-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
                <dt className="text-text-tertiary">{t('legal.email')}</dt>
                <dd>
                  <a
                    href={`mailto:${LEGAL_CONTACT.email}`}
                    className="font-semibold text-link hover:text-link-hover"
                  >
                    {LEGAL_CONTACT.email}
                  </a>
                </dd>
                <dt className="text-text-tertiary">{t('legal.phone')}</dt>
                <dd>
                  <a
                    href={`tel:${LEGAL_CONTACT.phone.replace(/\s/g, '')}`}
                    className="font-semibold text-link hover:text-link-hover"
                  >
                    {LEGAL_CONTACT.phone}
                  </a>
                </dd>
              </dl>
            </section>
          </article>
        </main>
      </div>
    </div>
  )
}

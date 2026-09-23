import type { ReactNode } from 'react'
import authBanner from '@/assets/auth/auth-banner.png'
import { LocaleSwitcher, Logo } from '@/shared/ui'

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: ReactNode
  description: ReactNode
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <main className="relative grid min-h-screen bg-bg-page lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      <div className="absolute end-4 top-4 z-dropdown sm:end-6 sm:top-6">
        <LocaleSwitcher className="bg-bg-surface shadow-xs" />
      </div>
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:h-full lg:overflow-y-auto lg:px-12">
        <section className="w-full max-w-auth" aria-labelledby="auth-title">
          <div className="flex justify-center">
            <Logo size="lg" alt="SocialOps" />
          </div>
          <div className="mt-6 text-center">
            <h1 id="auth-title" className="text-heading-1 text-text-primary">
              {title}
            </h1>
            <p className="mt-3 text-body-md text-text-secondary">{description}</p>
          </div>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-body-sm text-text-secondary">{footer}</p>
        </section>
      </div>
      <aside className="hidden h-full overflow-hidden bg-bg-surface-muted lg:block">
        <img src={authBanner} alt="" className="h-full w-full object-cover" aria-hidden="true" />
      </aside>
    </main>
  )
}

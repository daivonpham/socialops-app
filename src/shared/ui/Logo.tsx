import logoLightSm from '@/assets/logos/logo-light-sm.svg'

export type LogoSize = 'sm' | 'md' | 'lg'

export type LogoProps = {
  size?: LogoSize
  className?: string
  alt?: string
}

const SIZE_CLASS: Record<LogoSize, string> = {
  sm: 'size-6',
  md: 'size-8',
  lg: 'size-10',
}

const SIZE_PX: Record<LogoSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
}

/**
 * Single source of truth for the product logo used across the app.
 * If branding changes later, update this file instead of touching each screen.
 */
export function Logo({ size = 'md', className, alt = '' }: LogoProps) {
  return (
    <img
      src={logoLightSm}
      alt={alt}
      width={SIZE_PX[size]}
      height={SIZE_PX[size]}
      draggable={false}
      className={`${SIZE_CLASS[size]} ${className ?? ''}`}
    />
  )
}

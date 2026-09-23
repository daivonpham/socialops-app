import { Button as AntButton } from 'antd'
import { forwardRef, type CSSProperties } from 'react'
import type { ButtonProps } from '@/shared/ui/primitives/Button'

// design.md §40.1 mapping: primary→Ant primary, secondary→default, ghost→text,
// destructive→primary+danger, link→link. Sizes ride on controlHeight tokens (32/36/40).
const TYPE_BY_VARIANT = {
  primary: 'primary',
  secondary: 'default',
  ghost: 'text',
  destructive: 'primary',
  link: 'link',
} as const

const SIZE_MAP = { sm: 'small', md: 'middle', lg: 'large' } as const

export const Button = forwardRef<HTMLAnchorElement | HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'secondary',
      size = 'md',
      layered = true,
      borderRadius,
      htmlType = 'button',
      className,
      disabled,
      ...rest
    },
    ref,
  ) {
    const usesLayers = variant === 'primary' && layered
    const resolvedRadius =
      typeof borderRadius === 'number' ? `${borderRadius}px` : (borderRadius ?? '6px')
    const plainButtonStyle = borderRadius === undefined ? undefined : { borderRadius: resolvedRadius }
    const button = (
      <AntButton
        ref={ref}
        className={usesLayers ? 'app-button-layered__face' : className}
        style={usesLayers ? undefined : plainButtonStyle}
        type={TYPE_BY_VARIANT[variant]}
        danger={variant === 'destructive'}
        size={SIZE_MAP[size]}
        htmlType={htmlType}
        disabled={disabled}
        {...rest}
      />
    )

    if (!usesLayers) {
      return button
    }

    return (
      <span
        className={[
          'app-button-layered',
          `app-button-layered--${size}`,
          disabled ? '' : 'app-button-layered--enabled',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ '--button-layer-radius': resolvedRadius } as CSSProperties}
      >
        <span className="app-button-layered__middle">{button}</span>
      </span>
    )
  },
)

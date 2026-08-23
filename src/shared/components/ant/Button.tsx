import { Button as AntButton } from 'antd'
import { forwardRef } from 'react'
import type { ButtonProps } from '@/shared/ui/primitives/Button'

// design.md §40.1 mapping: primary→Ant primary, secondary→default, ghost→text,
// destructive→primary+danger, link→link. Sizes ride on controlHeight tokens (32/40/48).
const TYPE_BY_VARIANT = {
  primary: 'primary',
  secondary: 'default',
  ghost: 'text',
  destructive: 'primary',
  link: 'link',
} as const

const SIZE_MAP = { sm: 'small', md: 'middle', lg: 'large' } as const

export const Button = forwardRef<HTMLAnchorElement | HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'secondary', size = 'md', htmlType = 'button', ...rest }, ref) {
    return (
      <AntButton
        ref={ref}
        type={TYPE_BY_VARIANT[variant]}
        danger={variant === 'destructive'}
        size={SIZE_MAP[size]}
        htmlType={htmlType}
        {...rest}
      />
    )
  },
)

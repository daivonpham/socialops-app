import type { TranslationShape } from '@/shared/i18n'
import type { workspacesEnUS } from './en-US'

export const workspacesViVN = {
  switcher: {
    searchPlaceholder: 'Tìm workspace...',
    create: 'Tạo workspace',
    ariaLabel: 'Chuyển workspace',
    selectPlaceholder: 'Chọn workspace',
  },
} as const satisfies TranslationShape<typeof workspacesEnUS>

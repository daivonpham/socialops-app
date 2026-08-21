import type { TranslationShape } from './types'
import type { commonEnUS } from './en-US'

export const commonViVN = {
  dropdown: {
    noMatches: 'Không có kết quả.',
  },
  locales: {
    enUS: 'English (US)',
    viVN: 'Tiếng Việt',
  },
} as const satisfies TranslationShape<typeof commonEnUS>

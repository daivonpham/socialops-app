import type { TranslationShape } from '@/shared/i18n'
import type { brandsEnUS } from './en-US'

export const brandsViVN = {
  switcher: {
    ariaLabel: 'Chuyển thương hiệu',
    selectPlaceholder: 'Chọn thương hiệu',
  },
  picker: {
    title: 'Chọn thương hiệu',
    description: 'Tài khoản, nội dung và quyền trong SocialOps được giới hạn theo từng thương hiệu.',
    workspaceSection: 'Workspace',
    brandSection: 'Thương hiệu',
    pickWorkspaceFirst: 'Hãy chọn workspace trước.',
    noBrands: 'Workspace này chưa có thương hiệu. Hãy nhờ quản trị viên workspace tạo một thương hiệu.',
    openBrand: 'Mở thương hiệu',
  },
} as const satisfies TranslationShape<typeof brandsEnUS>

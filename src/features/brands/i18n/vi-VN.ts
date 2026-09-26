import type { TranslationShape } from '@/shared/i18n'
import type { brandsEnUS } from './en-US'

export const brandsViVN = {
  onboarding: {
    title: 'Tạo thương hiệu đầu tiên',
    description: 'Bạn có thể tạo ngay hoặc bỏ qua và tạo sau.',
    avatar: 'Ảnh đại diện thương hiệu',
    chooseAvatar: 'Chọn ảnh',
    name: 'Tên thương hiệu',
    namePlaceholder: 'Nhập tên thương hiệu',
    nameRequired: 'Nhập tên thương hiệu.',
    nameMin: 'Tên thương hiệu phải có ít nhất 2 ký tự.',
    nameMax: 'Tên thương hiệu không được vượt quá 120 ký tự.',
    invalidAvatar: 'Chọn ảnh PNG, JPEG hoặc WebP có dung lượng tối đa 5 MB.',
    createFailed: 'Không thể tạo thương hiệu. Vui lòng thử lại.',
    skip: 'Để sau',
    create: 'Tạo thương hiệu',
  },
  switcher: {
    searchPlaceholder: 'Tìm thương hiệu...',
    create: 'Tạo thương hiệu',
    ariaLabel: 'Chuyển thương hiệu',
    selectPlaceholder: 'Chọn thương hiệu',
    manage: 'Quản lý thương hiệu',
  },
  createModal: {
    title: 'Tạo thương hiệu',
    avatar: 'Ảnh đại diện thương hiệu',
    uploadAvatar: 'Tải ảnh thương hiệu',
    name: 'Tên thương hiệu',
    namePlaceholder: 'Nhập tên thương hiệu',
    nameRequired: 'Nhập tên thương hiệu.',
    nameMin: 'Tên thương hiệu phải có ít nhất 2 ký tự.',
    nameMax: 'Tên thương hiệu không được vượt quá 120 ký tự.',
    error: 'Không thể tạo thương hiệu. Vui lòng thử lại.',
    cancel: 'Hủy',
    submit: 'Tạo thương hiệu',
  },
  editModal: {
    title: 'Chỉnh sửa thương hiệu',
    name: 'Tên thương hiệu',
    changeAvatar: 'Đổi ảnh',
    error: 'Không thể cập nhật thương hiệu. Vui lòng thử lại.',
    cancel: 'Hủy',
    submit: 'Lưu thay đổi',
  },
  manageModal: {
    title: 'Quản lý thương hiệu',
    description: 'Tạo và quản lý các thương hiệu trong workspace hiện tại.',
    create: 'Tạo thương hiệu',
    edit: 'Chỉnh sửa {{name}}',
    delete: 'Xóa {{name}}',
  },
  deleteModal: {
    title: 'Xóa thương hiệu',
    description:
      'Bạn có chắc muốn xóa thương hiệu “{{name}}”? Toàn bộ tài khoản mạng xã hội và dữ liệu thuộc thương hiệu này sẽ bị xóa vĩnh viễn.',
    confirmationLabel: 'Nhập “{{name}}” để xác nhận',
    error: 'Không thể xóa thương hiệu. Vui lòng thử lại.',
    cancel: 'Hủy',
    confirm: 'Xóa thương hiệu',
  },
  toast: {
    createSuccess: 'Đã tạo thương hiệu thành công.',
    createError: 'Không thể tạo thương hiệu.',
    updateSuccess: 'Đã cập nhật thương hiệu thành công.',
    updateError: 'Không thể cập nhật thương hiệu.',
    deleteSuccess: 'Đã xóa thương hiệu thành công.',
    deleteError: 'Không thể xóa thương hiệu.',
  },
  picker: {
    title: 'Chọn thương hiệu',
    description:
      'Tài khoản, nội dung và quyền trong SocialOps được giới hạn theo từng thương hiệu.',
    workspaceSection: 'Workspace',
    brandSection: 'Thương hiệu',
    pickWorkspaceFirst: 'Hãy chọn workspace trước.',
    noBrands:
      'Workspace này chưa có thương hiệu. Hãy nhờ quản trị viên workspace tạo một thương hiệu.',
    openBrand: 'Mở thương hiệu',
  },
} as const satisfies TranslationShape<typeof brandsEnUS>

import type { TranslationShape } from '@/shared/i18n'
import type { workspacesEnUS } from './en-US'

export const workspacesViVN = {
  switcher: {
    searchPlaceholder: 'Tìm workspace...',
    create: 'Tạo workspace',
    ariaLabel: 'Chuyển workspace',
    selectPlaceholder: 'Chọn workspace',
    manage: 'Quản lý workspace',
  },
  createModal: {
    title: 'Tạo workspace',
    name: 'Tên workspace',
    namePlaceholder: 'Nhập tên workspace',
    nameRequired: 'Nhập tên workspace.',
    nameMin: 'Tên workspace phải có ít nhất 2 ký tự.',
    nameMax: 'Tên workspace không được vượt quá 120 ký tự.',
    error: 'Không thể tạo workspace. Vui lòng thử lại.',
    cancel: 'Hủy',
    submit: 'Tạo workspace',
  },
  manageModal: {
    title: 'Quản lý workspace',
    description: 'Tạo và quản lý các workspace bạn có quyền truy cập.',
    create: 'Tạo workspace',
    edit: 'Chỉnh sửa {{name}}',
    delete: 'Xóa {{name}}',
  },
  editModal: {
    title: 'Chỉnh sửa workspace',
    error: 'Không thể cập nhật workspace. Vui lòng thử lại.',
    cancel: 'Hủy',
    submit: 'Lưu thay đổi',
  },
  deleteModal: {
    title: 'Xóa workspace',
    description:
      'Bạn có chắc muốn xóa workspace “{{name}}”? Toàn bộ thương hiệu và dữ liệu thuộc workspace này sẽ bị xóa vĩnh viễn.',
    confirmationLabel: 'Nhập “{{name}}” để xác nhận',
    error: 'Không thể xóa workspace. Vui lòng thử lại.',
    cancel: 'Hủy',
    confirm: 'Xóa workspace',
  },
  roles: {
    owner: 'Chủ sở hữu',
    admin: 'Quản trị viên',
    editor: 'Biên tập viên',
    viewer: 'Người xem',
  },
  toast: {
    createSuccess: 'Đã tạo workspace thành công.',
    createError: 'Không thể tạo workspace.',
    updateSuccess: 'Đã cập nhật workspace thành công.',
    updateError: 'Không thể cập nhật workspace.',
    deleteSuccess: 'Đã xóa workspace thành công.',
    deleteError: 'Không thể xóa workspace.',
  },
} as const satisfies TranslationShape<typeof workspacesEnUS>

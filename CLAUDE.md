# SocialOps App: bản đồ cho agent

Frontend React + Vite + TypeScript, Ant Design làm nền hành vi, TanStack Query. API nằm ở repo kế bên `../socialops-api` (NestJS, cổng 3000). App chạy cổng 5073. Hai dev server do người dùng tự chạy: không khởi động lại.

## Đọc gì, khi nào

Chỉ đọc phần cần cho việc đang làm, không đọc toàn bộ source. Với docs dài (handoff, plan, `design.md`), grep `^#` trước rồi chỉ đọc mục liên quan.

- Đụng tới API thì đọc thêm `../socialops-api/CLAUDE.md`; file này không tự nạp khi mở app.
- Trạng thái dự án và việc tiếp theo: `../socialops-api/docs/PROJECT_HANDOFF.md`.
- Kế hoạch theo tính năng: `../socialops-api/docs/*_PLAN.md` (`REPORTS_PLAN`, `REPORTS_EXPORT_PLAN`, `FACEBOOK_PUBLISHING_PLAN`).
- Skill nằm ở `.agent/skills/<tên>/SKILL.md`. Mở `references/` chỉ khi SKILL.md trỏ tới.

| Việc                         | Skill                                                      |
| ---------------------------- | ---------------------------------------------------------- |
| Feature mới, màn hình mới    | `create-admin-feature`, `frontend-admin-architecture`      |
| Gọi API, hook query/mutation | `create-api-module`, `frontend-shared-platform`            |
| Xử lý lỗi API                | `frontend-shared-platform` (`references/api-errors.md`)    |
| UI, token, component         | `frontend-design-system` + mục liên quan trong `design.md` |
| Chuỗi hiển thị, locale       | `frontend-i18n`                                            |
| Auth, OAuth, quyền, XSS      | `frontend-admin-security`                                  |
| Hiệu năng, bảng lớn, bundle  | `frontend-admin-performance`, `react-best-practices`       |
| Refactor component           | `composition-patterns`, `frontend-code-simplicity`         |
| Review UI/UX, a11y           | `web-design-guidelines`                                    |

`design.md` dài khoảng 2.000 dòng. Tìm `^# <số>.` rồi chỉ đọc mục cần:

| Mục    | Nội dung              |
| ------ | --------------------- |
| §7     | Màu ngữ nghĩa         |
| §9     | Typography            |
| §10    | Spacing               |
| §11    | Radius                |
| §17    | Icon                  |
| §18–35 | Component             |
| §36    | Biểu đồ               |
| §41–54 | Màn hình theo domain  |
| §58–62 | Ant Design            |
| §65–71 | Bố cục trang và state |
| §75    | Luật cho AI           |

## Bản đồ source

- `src/app/`: shell, router (`router/paths.ts`, `routes.tsx`), providers, i18n gốc (`i18n/resources.ts` đăng ký namespace).
- `src/features/<tên>/`: `api/` (`service.ts`, `hooks.ts`, `types.ts`), `components/`, `pages/`, `i18n/{vi-VN,en-US}.ts`, `index.ts`.
  - Features: `auth`, `brands`, `workspaces`, `overview`, `facebook`, `tiktok`, `social-accounts`, `planning`, `reports`, `google`, `profile`, `privacy`.
- `src/shared/ui/`: primitives (`primitives/`), `DataTable`, `charts`, `AsyncState`… Mọi UI và icon import từ `@/shared/ui`.
- `src/shared/`: `api` (http client, `errors.ts` đọc lỗi API), `auth`, `permissions`, `scope` (workspace/brand), `hooks`, `lib`, `styles/tokens.ts`.

## Luật bắt buộc

- Eslint chặn các import sau trong feature:
  - `@/app`;
  - `antd` trực tiếp;
  - deep import `@/shared/ui/*`;
  - nội bộ feature khác (`@/features/x/y`); chỉ được import qua `@/features/x`.
- Màu chỉ dùng token Tailwind ngữ nghĩa, không hex. Không dùng màu xanh mặc định của Ant.
- Spacing chỉ dùng thang 0,1,2,3,4,5,6,8,10,12,16,20,24. Giá trị ngoài thang phải viết arbitrary, ví dụ `gap-[10px]`.
- Không có Skeleton: loading dùng `Spin`/`AsyncState`. Mỗi màn hình phải có đủ trạng thái loading, empty, error.
- Mọi chuỗi hiển thị qua i18n, có đủ cả `vi-VN` và `en-US`.
- Lỗi API: đọc bằng `@/shared/api/errors` (`isApiErrorCode`, `getApiError`), hiển thị bằng `useApiErrorMessage(ns)(error, fallback)`. Không đọc `error.response` hay HTTP status trong feature. Mã lỗi dịch trong namespace `errors` (`src/shared/i18n/errors`); API thêm mã thì thêm bản dịch ở đây.
- Báo cáo (UI, PDF, Excel, Sheets) dùng từ trung lập "Kênh/Channel". Không ghi Facebook, Page hay Meta, vì báo cáo sẽ gộp nhiều mạng xã hội.

## Kiểm tra

`npx tsc --noEmit`, `npm run lint`, `npm test` (vitest). Chỉ chạy khi được yêu cầu hoặc trước khi bàn giao.

## Làm việc

- Trả lời bằng tiếng Việt.
- Hành vi sản phẩm còn mơ hồ thì hỏi trước khi làm.
- Chỉ commit/push khi được yêu cầu. Không commit `.env`.
- Meta App Review, xác minh Google và trang chính sách quyền riêng tư để cuối cùng.

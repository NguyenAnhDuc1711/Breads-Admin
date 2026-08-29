# Handoff: Task #6

## What Was Done
Tạo `src/config/routes.ts` (`ROUTE_ROLES` map, comment cross-reference tới bảng FR-5). Thêm role-guard vào `AdminLayout.tsx`: đọc `currentUser` qua `useGetCurrentUserQuery`, chờ `isLoading` xong mới quyết định (không flash-redirect), default-deny khi role không hợp lệ/không có trong danh sách, `<Navigate to="/login" replace/>` khi thiếu quyền, lọc sidebar chỉ hiện mục role được phép. Sửa `LoginPage.tsx`: chấp nhận cả ADMIN và MODERATOR đăng nhập.

## Decisions Made
- **Phát hiện + fix thêm ngoài mô tả gốc của task:** sau khi đổi Users thành ADMIN-only, `navigate("/users")` sau login thành công (code cũ) sẽ khiến Moderator đăng nhập xong bị AdminLayout đá ngược lại `/login` ngay lập tức — vòng lặp khó hiểu. Đổi target thành `navigate("/")` (Overview, cả 2 role đều vào được).
- `isLoading` check trả `null` (không render gì) thay vì spinner — chấp nhận được vì thời gian loading rất ngắn (query đã cache từ trước ở hầu hết trường hợp), không cần thêm UI mới ngoài scope.

## Files Changed
- `src/config/routes.ts` (mới)
- `src/layouts/AdminLayout.tsx` (thêm guard logic)
- `src/pages/LoginPage.tsx` (mở rộng role được chấp nhận + sửa target điều hướng)

## Verification Done
- `npm run build` + `npm run lint` pass.
- Test trực tiếp trên trình duyệt với session ADMIN thật đang có sẵn: vào `/users` vẫn hoạt động bình thường, sidebar hiện đủ 5 mục (đúng vì role ADMIN được phép mọi route) — xác nhận happy path ADMIN không bị regression.

## Chưa verify được (cần epic-verify #7 xác nhận thêm)
- **Chưa có tài khoản test role Moderator thật** trong phiên này để verify trực tiếp: (a) Moderator đăng nhập thành công, (b) sidebar ẩn mục "Users" với Moderator, (c) Moderator gõ thẳng URL `/users` bị đá về `/login`. Logic đã type-check sạch, đúng theo AC đã viết trong task file, nhưng đây là phần cần 1 tài khoản Moderator thật để xác nhận runtime — cần tạo trước khi chạy #7.
- Case "role không hợp lệ/undefined → default-deny" cũng chưa test runtime được vì lý do tương tự.

## Warnings for Next Task
- #7 (Verification) cần: tạo ít nhất 1 tài khoản test role MODERATOR (update trực tiếp DB hoặc qua 1 script) trước khi chạy checklist đầy đủ — nếu không có, phần SC-5/SC-6 của PRD không thể verify runtime được, chỉ verify được qua đọc code.

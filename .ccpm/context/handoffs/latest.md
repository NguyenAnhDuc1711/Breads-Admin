# Handoff: Task #3

## What Was Done
Tạo `src/layouts/AdminLayout.tsx` + `AdminLayout.css` (sidebar tĩnh 5 mục, `<Outlet/>`, chưa có role-guard — dành cho task #6). Tạo `src/pages/ComingSoonPage.tsx` (placeholder tái dùng cho 4 route chưa có nội dung). Sửa `App.tsx`: xoá redirect `/`→`/users` cũ, mount route lồng nhau dưới `AdminLayout` cho cả 5 route (`/`, `/posts`, `/posts/validation`, `/report`, `/users`).

## Decisions Made
- Dùng 1 `ComingSoonPage` component chung (nhận prop `title`) cho cả Overview lẫn 3 route placeholder khác, thay vì tạo `OverviewPlaceholder` riêng như phác thảo ban đầu trong task file — không có khác biệt nội dung nào giữa chúng ở giai đoạn này, tạo 2 component trùng lặp không cần thiết.
- Sidebar dùng `NavLink` với `end` prop cho route `/` (tránh active-state dính vào mọi route con).

## Files Changed
- `src/layouts/AdminLayout.tsx` (mới)
- `src/layouts/AdminLayout.css` (mới)
- `src/pages/ComingSoonPage.tsx` (mới)
- `src/App.tsx` (sửa)

## Verification Done
- `npm run build` pass, `npm run lint` pass.
- Kiểm tra trực tiếp qua trình duyệt (Chrome, dev server cổng 5174): `/` hiện Overview placeholder (không redirect `/users` nữa), `/posts` hiện Posts placeholder, `/users` hiện `UsersPage` nguyên trạng (bảng đúng 5 cột, chỉ "No matching data found" vì không có Be chạy local — không phải lỗi của thay đổi này). Sidebar active-state đúng theo route.
- Đã tắt dev server sau khi test xong (`pkill -f vite` — có thể đã tắt cả dev server khác nếu bạn đang chạy song song, chạy lại `npm run dev` nếu cần).

## Warnings for Next Task
- Task #6 (FE route-guard) sẽ thêm logic vào chính `AdminLayout.tsx` — không cần đổi lại cấu trúc route, chỉ chèn guard trước `<Outlet/>`.
- Task #5 (SearchableTable) sẽ sửa `UsersPage.tsx` — route `/users` không đổi, an toàn để refactor nội dung bên trong.

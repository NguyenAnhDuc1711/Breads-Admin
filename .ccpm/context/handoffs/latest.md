# Handoff: Task #4

## What Was Done
Tạo `src/api/middlewares/requireRole.ts` (Breads-Be) với 2 export: `requireRole(...roles)` (role-check thuần) và `requireSelfOrRole(...roles)` (cho qua nếu tự thao tác trên chính mình HOẶC đủ role — dùng cho endpoint dùng chung). Wire vào 7 endpoint theo đúng bảng role-mapping FR-5, cộng 1 fix ngoài dự kiến (xem Scope Addendum trong task file).

## Decisions Made
- Phát hiện `PUT /users/:id` là endpoint dùng chung (tự sửa hồ sơ + admin đổi status) — đã dừng lại xin xác nhận user trước khi mở rộng scope, thêm `requireSelfOrRole` thay vì `requireRole` thuần cho riêng endpoint này.
- Sửa luôn bug có sẵn ở `user.controller.ts::updateUser` (check tự-so-sánh-chính-mình vô nghĩa, không bao giờ chặn) — xoá hẳn thay vì sửa, vì `requireSelfOrRole` middleware giờ là nguồn xác thực quyền duy nhất, controller không cần tự kiểm tra lại.
- Đã xác nhận (đọc code Breads-Fe `config/API.ts`) axios interceptor tự gắn `Authorization` header cho MỌI request khi có `accessToken` — nên thêm `protectRoute` vào 5 endpoint trước đây không có sẽ KHÔNG phá client hiện tại của Breads-Fe (đã dùng token sẵn vì các trang admin đó vốn đã yêu cầu login).

## Files Changed (repo Breads-Be)
- `src/api/middlewares/requireRole.ts` (mới)
- `src/api/routers/user.route.ts` (thêm `requireRole`/`requireSelfOrRole` cho 2 endpoint)
- `src/api/routers/post.route.ts` (thêm `protectRoute`+`requireRole` cho 2 endpoint)
- `src/api/routers/report.route.ts` (thêm `protectRoute`+`requireRole` cho 3 endpoint)
- `src/api/controllers/user.controller.ts` (xoá check tự-so-sánh bị lỗi trong `updateUser`)

## Verification Done
- `npx tsc --noEmit` — 2 lỗi pre-existing không liên quan (unused var ở dòng 24/531, không đụng tới code mới) — 0 lỗi mới.
- **Không chạy được** `npm test` đầy đủ — nhiều file test trong repo import router thật, kéo theo kết nối Redis lúc import (`services/feed/queue.ts` mở `new Redis()` ngay khi module load); Redis không chạy trong môi trường này → treo event loop, không bao giờ exit (đã xác nhận qua comment trong chính `post.route.test.ts`, đây là giới hạn môi trường có sẵn, không phải do thay đổi của task này).
- Verify thay thế: (1) đọc lại source 3 router file, xác nhận `protectRoute` luôn đứng NGAY TRƯỚC `requireRole`/`requireSelfOrRole` ở cả 7 endpoint (đúng NFR-2). (2) Server dev thật (`tsx watch src/server.ts`, đã chạy sẵn từ trước, hot-reload tự động) — curl trực tiếp cả 4 endpoint từng thiếu auth, KHÔNG kèm token: cả 4 đều trả **401** (trước đây sẽ trả 200/lộ dữ liệu). Server không crash sau reload.
- **Chưa verify được** case 403 (role hợp lệ nhưng không đủ quyền) bằng request thật — thiếu tài khoản test có token role USER/MODERATOR sẵn có trong phiên này. Logic đã type-check sạch và khớp đúng pattern `protectRoute.ts`, nhưng đây là phần CẦN kiểm tra thủ công thêm ở bước epic-verify (090) trước khi coi epic hoàn thành.

## Warnings for Next Task
- Task #6 (FE route-guard) không phụ thuộc trực tiếp vào code Be này để build, nhưng cần Be đã chạy đúng để test end-to-end thật.
- **Việc còn thiếu, phải làm ở #7 (Verification):** test case 403 thật cho cả 7 endpoint bằng token role không đủ — chưa được verify trong task này, chỉ mới verify được 401 (chưa đăng nhập).

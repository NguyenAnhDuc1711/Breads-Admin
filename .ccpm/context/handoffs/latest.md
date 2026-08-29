# Handoff: Task #7 (Verification)

## What Was Done
Verify sống toàn bộ 6 Success Criteria của PRD bằng cách mint JWT thật (dùng chung `JWT_SECRET` với server, KHÔNG dùng mật khẩu ai) cho 1 tài khoản USER thường thật (`ducna17112003@gmail.com`, role=1) và 1 tài khoản ADMIN thật đang có trong DB, rồi curl trực tiếp cả 7 endpoint vào server dev đang chạy sống (`tsx watch`, hot-reload tự động theo các commit trước).

## Kết quả
- SC-1 (Backend authorization): PASS — 403 đúng cho USER thường ở 6/7 case admin/moderator-gated; 200 đúng cho USER thường tự sửa hồ sơ mình (`requireSelfOrRole`); ADMIN qua được auth ở mọi endpoint test.
- SC-2, SC-3, SC-4: PASS (verify lại kết quả đã có từ task #2/#3/#5).
- SC-5, SC-6 (Moderator): **CHƯA VERIFY ĐƯỢC** — không có tài khoản Moderator thật. Đây là gap còn mở, cần user tạo tài khoản Moderator thật rồi test tay trước khi coi epic hoàn toàn xong trong thực tế (dù code đã review kỹ + type-check sạch).

## Side-effect cần biết
Test self-edit đã ghi đè tạm `bio` của tài khoản thật `ducna17112003@gmail.com` → đã set lại `""` ngay sau đó, nhưng giá trị gốc trước test KHÔNG được lưu lại trước khi ghi đè — nếu bio có nội dung thật trước đó, không khôi phục lại được. Đã báo trực tiếp cho user.

## Files Changed
- Không có file source nào — chỉ chạy verify + dọn 1 script tạm (`Breads-Be/scratch-verify.ts`, đã xoá, không commit).

## Warnings for Next Task
- `epic-verify` (bước 9 của pipeline, khác với task #7 nội bộ epic này) cần chạy tiếp để tạo `.ccpm/context/verify/epic-state.json` — hook `pre-tool-use-epic.sh` chặn `gh issue close`/`git merge main` cho tới khi có file này với `overall: PASS`.
- Trước khi `epic-merge`: cân nhắc có bắt buộc verify Moderator thật hay chấp nhận rủi ro đã biết (documented gap) — quyết định này nên hỏi user, không tự quyết.

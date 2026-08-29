---
epic: social-media-management
branch: epic/social-media-management
started: 2026-08-29T07:42:53Z
status: in-progress
---
# Epic Context: social-media-management

## Key Decisions
- Role model mở rộng enum số nguyên (không permission-based) — AD-1.
- Backend authorization qua middleware factory `requireRole(...roles)` — AD-2.
- FE route-guard component-level trong `AdminLayout`, không dùng React Router loader — AD-5.
- `SearchableTable` chỉ rút props tối giản theo đúng UsersPage (2 bằng chứng thật), không thiết kế trước cho Posts CMS — AD-4.
- Epic chạm 3 repo (`Breads-Admin`, `Breads-Be`, `Breads-Shared`) — task #2 (role Moderator + submodule sync) PHẢI xong trước khi #4/#6 chạy.
- Redirect khi thiếu quyền: về `/login` (không xây trang 403 riêng).

## Notes
- `Breads-Admin` không có test framework (`package.json` chỉ có dev/build/lint/preview) — phần FE xác minh bằng thủ công, không phải test tự động (xem plan-review TEST-1).
- `Breads-Be` có test framework — phần Be (#4) dùng test tự động.
- plan-review tìm 4 finding (1 critical: route `/` conflict với redirect cũ; 3 warning) — cả 4 đã fix trực tiếp vào epic.md/task file trước khi decompose xong.
- Task file numbering sau epic-sync: 001→#2, 002→#3, 010→#4, 011→#5, 012→#6, 090→#7 (xem `github-mapping.md`).

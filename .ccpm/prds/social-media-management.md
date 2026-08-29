---
name: "social-media-management"
description: "Khung điều hướng + phân quyền cho hệ thống quản trị mạng xã hội Breads trong Breads-Admin"
status: "complete"
priority: "high"
scale: "medium"
created: "2026-08-29T07:23:26Z"
updated: "2026-08-29T08:30:17Z"
---

## Executive Summary

Breads-Admin (CMS quản trị độc lập cho hệ thống mạng xã hội Breads) hiện chỉ có 1 khu vực chức năng — Users — trong khi 4 khu vực còn lại (Overview, Posts, Posts Validation, Report) vẫn nằm trong `/admin/*` của Breads-Fe, chưa được tách ra và chưa có khung điều hướng chung để chứa. Đào sâu backend cho thấy vấn đề nghiêm trọng hơn phần thiếu UI: `Breads-Be` hiện chỉ xác thực (`protectRoute` verify JWT) chứ không hề phân quyền theo role — 7 endpoint quản trị (đổi status/ban user, đổi status/visibility bài đăng, xử lý report) có thể bị gọi bởi bất kỳ ai có token hợp lệ, một số còn không cần đăng nhập. Feature này xây khung điều hướng đủ chỗ cho cả 5 khu vực, đồng thời đưa phân quyền thật sự (role Admin/Moderator) vào cả Backend lẫn Frontend — vá đúng lỗ hổng đang tồn tại trong tính năng Users production hiện tại, làm nền cho các module nội dung (Posts/Report/Overview) xây tiếp sau. Làm ngay bây giờ vì thêm mỗi tính năng quản trị mới trên nền tảng chưa phân quyền là mở rộng thêm bề mặt tấn công.

## Problem Statement

**Ai gặp vấn đề:** Đội vận hành Breads gồm 2 nhóm — vài Admin (toàn quyền) và một lượng lớn Content Moderator (duyệt nội dung, xử lý report). Hiện tại không nhóm nào có 1 hệ thống quản trị hoàn chỉnh, độc lập để làm việc: phải tiếp tục dùng `/admin/*` trong Breads-Fe cho 4/5 khu vực nghiệp vụ.

**Tần suất & mức độ nghiêm trọng:** Report/Posts Validation là công việc thường xuyên (moderator dùng hàng ngày) — mỗi ngày trễ là nội dung vi phạm tiếp tục hiển thị lâu hơn. Vấn đề bảo mật (thiếu authorization ở Be) là liên tục, không phải theo tần suất sử dụng — tồn tại 24/7 kể từ khi endpoint `PUT /users/:id` được Breads-Admin gọi trong production.

**Hiện tại làm gì để đối phó:** Không có workaround nào — người dùng tiếp tục thao tác qua Breads-Fe (dùng chung UI với end-user, không tách biệt), và không ai đang giám sát/vá lỗ hổng authorization vì nó chưa được phát hiện trước khi thực hiện phiên rethink này.

## Target Users

**Persona 1 — Admin**
- Vai trò: Quản trị viên toàn quyền hệ thống Breads
- Bối cảnh: Số lượng ít, thao tác không thường xuyên bằng Moderator nhưng cần toàn quyền — bao gồm quản lý Users (ban/mở khóa tài khoản) và mọi khu vực khác
- Nhu cầu chính: 1 nơi duy nhất, đáng tin cậy để quản trị toàn hệ thống, không phụ thuộc Breads-Fe
- Mức độ pain: Cao — hiện phải dùng Breads-Fe cho phần lớn công việc, không có gì đảm bảo chỉ mình họ mới thao tác được

**Persona 2 — Content Moderator**
- Vai trò: Người kiểm duyệt nội dung, xử lý report vi phạm
- Bối cảnh: Số lượng đông, dùng hệ thống hàng ngày, chỉ cần truy cập Posts + Report — không nên (và không cần) đụng vào Users
- Nhu cầu chính: Đăng nhập được vào Breads-Admin, chỉ thấy đúng phạm vi công việc của mình, không bị chặn nhầm cũng không thấy thừa chức năng nhạy cảm
- Mức độ pain: Cao — hiện tại role Moderator **chưa tồn tại**, nên nhóm này về lý thuyết đang phải mượn quyền Admin hoặc thao tác ngoài luồng chính thức để làm việc

## User Stories

**US-1** (Admin): Là Admin, tôi muốn đăng nhập vào Breads-Admin và thấy sidebar liệt kê đủ 5 khu vực quản trị, để biết hệ thống có những gì mà không cần đoán URL.
- AC: GIVEN đã đăng nhập với role Admin, WHEN vào Breads-Admin, THEN sidebar hiển thị 5 mục điều hướng (Overview, Posts, Posts Validation, Report, Users), mỗi mục dẫn đúng route tương ứng.

**US-2** (Admin): Là Admin, tôi muốn trang Users hoạt động y hệt hiện tại sau khi refactor sang component dùng chung, để không phải học lại thao tác.
- AC: GIVEN Admin ở `/users`, WHEN tìm kiếm/phân trang/đổi status, THEN hành vi và dữ liệu giống hệt bản hiện tại (không regression).

**US-3** (Moderator): Là Content Moderator, tôi muốn đăng nhập được vào Breads-Admin (hiện bị chặn vì hệ thống chỉ nhận role Admin), để bắt đầu làm việc.
- AC: GIVEN tài khoản có role Moderator, WHEN đăng nhập ở `/login`, THEN đăng nhập thành công (không bị từ chối như hiện tại — vốn chỉ chấp nhận role Admin).

**US-4** (Moderator): Là Content Moderator, tôi muốn sidebar chỉ hiện Posts/Posts Validation/Report (không hiện Users), và bị chặn nếu cố vào thẳng URL `/users`, để không thấy/chạm nhầm vào chức năng ngoài phạm vi.
- AC: GIVEN đăng nhập với role Moderator, WHEN xem sidebar, THEN mục Users không hiển thị; WHEN truy cập trực tiếp URL `/users`, THEN bị chặn và điều hướng khỏi trang đó.

**US-5** (Admin & Moderator): Là người dùng Breads-Admin, tôi muốn mọi hành động quản trị của mình được backend xác nhận đúng quyền, để biết hệ thống thực sự an toàn chứ không chỉ "trông có vẻ" an toàn qua giao diện.
- AC: GIVEN gọi trực tiếp 1 trong 7 endpoint quản trị đã xác định bằng token có role không đủ quyền (vd: token role USER thường), WHEN request tới Be, THEN nhận về 403, không thực hiện hành động.

## Requirements

### Functional Requirements

**FR-1 (MUST):** `AdminLayout` component cung cấp sidebar điều hướng cho 5 khu vực (Overview, Posts, Posts Validation, Report, Users) và vùng nội dung (`<Outlet/>`).
- GIVEN người dùng đã đăng nhập hợp lệ, WHEN vào bất kỳ route con nào của AdminLayout, THEN sidebar luôn hiển thị, mục tương ứng route hiện tại được đánh dấu active.

**FR-2 (MUST):** Routing skeleton trong `App.tsx` khai báo đủ 5 route lồng trong `AdminLayout`: `/` (Overview), `/posts`, `/posts/validation`, `/report`, `/users`. 4 route chưa có nội dung (Overview, Posts, Posts Validation, Report) hiển thị placeholder rõ ràng, không phải trang trắng/lỗi.
- GIVEN role đủ quyền truy cập, WHEN điều hướng tới 1 trong 4 route chưa có nội dung, THEN thấy placeholder ghi rõ khu vực đang chờ triển khai (không phải lỗi 404/trắng trang).

**FR-3 (MUST):** Component `SearchableTable` dùng chung (search input debounce + bảng phân trang + trạng thái loading/rỗng), `UsersPage` refactor để dùng lại component này thay vì code bảng riêng.
- GIVEN `UsersPage` sau refactor, WHEN thực hiện search/phân trang/đổi status, THEN hành vi giống hệt trước refactor (US-2).

**FR-4 (MUST):** Thêm `MODERATOR: 2` vào `Constants.USER_ROLE` trong repo `Breads-Shared`; bump submodule pointer ở cả `Breads-Admin`, `Breads-Fe`, `Breads-Be` sau khi merge.
- GIVEN thay đổi đã merge vào `Breads-Shared`, WHEN kiểm tra submodule SHA ở 3 repo, THEN cả 3 trỏ cùng 1 commit chứa `MODERATOR`.

**FR-5 (MUST):** Middleware `requireRole(...roles)` ở `Breads-Be`, áp dụng theo bảng:

| Endpoint | Role tối thiểu |
|---|---|
| `PUT /users/:id`, `GET /users/with-status` | ADMIN |
| `PATCH /posts/:id/status`, `PATCH /posts/:id/visibility` | ADMIN, MODERATOR |
| `GET /reports`, `PATCH /reports/:id/response`, `PATCH /reports/:id/reject` | ADMIN, MODERATOR |

- GIVEN request tới 1 trong 7 endpoint trên với role không đủ, WHEN middleware `requireRole` chạy, THEN trả 403 trước khi vào controller.
- GIVEN request với role đủ quyền, WHEN qua `requireRole`, THEN controller thực thi bình thường (không đổi hành vi nghiệp vụ hiện có).

**FR-6 (MUST):** FE route-guard trong `AdminLayout` — đọc role qua `useGetCurrentUserQuery` hiện có, danh sách role-cho-phép khai báo theo từng route. Role không đủ quyền → điều hướng `/login`; mục sidebar tương ứng ẩn khỏi role không có quyền.
- GIVEN role Moderator, WHEN truy cập route chỉ dành ADMIN (`/users`), THEN bị điều hướng khỏi route đó (US-4).

**FR-7 (MUST):** Mở rộng `tagTypes` của `baseApi` (`Post`, `Report`) để các module tương lai (ngoài scope epic này) có thể `injectEndpoints` mà không cần sửa lại `baseApi`.
- GIVEN `baseApi` sau thay đổi, WHEN 1 endpoint tương lai dùng `providesTags: ["Post"]` hoặc `["Report"]`, THEN không có lỗi type.

**FR-8 (MUST):** Cập nhật `LoginPage.tsx` — điều kiện từ chối đăng nhập đổi từ "role khác ADMIN" thành "role không thuộc {ADMIN, MODERATOR}".
- GIVEN tài khoản role Moderator, WHEN đăng nhập ở `/login`, THEN đăng nhập thành công (US-3) — hiện tại bị từ chối vì code chỉ chấp nhận `role === ADMIN`.

### Non-Functional Requirements

**NFR-1 (MUST):** Không regression ở `UsersPage` sau refactor sang `SearchableTable`.
- GIVEN `UsersPage` trước và sau refactor, WHEN so sánh hành vi search/phân trang/đổi status trên cùng dữ liệu, THEN kết quả và UX giống hệt nhau.

**NFR-2 (MUST):** Middleware `requireRole` không phá vỡ luồng xác thực hiện có của `protectRoute`.
- GIVEN `requireRole` đặt sau `protectRoute` trong middleware chain, WHEN request đi qua cả 2 middleware, THEN side-effect `lastActiveAt` của `protectRoute` vẫn chạy đúng và luồng refresh-token (401 `TOKEN_EXPIRED` → refresh → retry) ở FE không bị ảnh hưởng.

## Success Criteria

1. **Phân quyền Backend:** 100% trong 7 endpoint ở bảng FR-5 enforce đúng role — đo bằng test tự động: gọi mỗi endpoint với token role thấp hơn yêu cầu, tất cả phải trả 403.
2. **Điều hướng đầy đủ:** Cả 5 route đích truy cập được qua sidebar `AdminLayout`; 4 route chưa có nội dung hiển thị placeholder (không lỗi/trắng trang) — kiểm tra thủ công qua trình duyệt.
3. **Không regression:** Bộ test hiện có của `UsersPage` (nếu có) hoặc kiểm thử thủ công luồng search/phân trang/đổi status pass 100% sau refactor.
4. **Đồng bộ submodule:** `git submodule status` ở cả 3 repo (`Breads-Admin`, `Breads-Fe`, `Breads-Be`) trỏ cùng 1 SHA của `Breads-Shared` chứa `MODERATOR`.
5. **Route-guard đúng theo role:** Tài khoản role Moderator không thấy mục "Users" trong sidebar và bị chặn khi truy cập trực tiếp URL `/users` — kiểm tra thủ công với 1 tài khoản Moderator thật.
6. **Moderator đăng nhập được:** Tài khoản role Moderator đăng nhập thành công ở `/login` (hiện tại bị từ chối) — kiểm tra thủ công, đối chiếu với hành vi trước khi có FR-8.

## Risks & Mitigations

| # | Risk | Severity | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| 1 | Submodule `Breads-Shared` lệch SHA giữa 3 repo do bump không đồng bộ | High | Medium | Type/constant lệch giữa các repo, lỗi khó debug (đã surface ở prd-rethink Decision 5) | Tách task bump submodule riêng, đầu epic, verify SHA khớp cả 3 repo trước khi làm task khác |
| 2 | `requireRole` đặt sai vị trí trong middleware chain, phá `lastActiveAt`/refresh-token flow của `protectRoute` | Medium | Low | Session/refresh-token silently hỏng, khó phát hiện qua test thông thường | NFR-2 + test tích hợp riêng cho luồng refresh-token sau khi thêm `requireRole` |
| 3 | Đổi điều kiện `LoginPage.tsx` (FR-8) vô tình mở đăng nhập cho role khác ngoài ADMIN/MODERATOR nếu logic viết sai (vd: dùng `!==` thay vì kiểm tra danh sách) | High | Low | Tài khoản USER thường đăng nhập được vào Breads-Admin — đúng lỗ hổng đang cố vá lại xuất hiện dạng khác | Test case rõ ràng: role USER phải bị từ chối đăng nhập, chỉ ADMIN/MODERATOR được chấp nhận |
| 4 | `SearchableTable` (FR-3) trừu tượng hoá sai vì rút ra chỉ từ 1 lần refactor UsersPage, chưa có Posts CMS thực tế để đối chiếu | Medium | Medium | Phải sửa lại interface khi build Posts CMS ở epic sau | Giữ interface tối giản (props rõ ràng: columns, data, loading, pagination), không đoán trước tính năng Posts CMS chưa cần |

## Constraints & Assumptions

- **Constraint:** `Breads-Shared` là git submodule độc lập (repo riêng, `.gitmodules` xác nhận) — mọi thay đổi type/constant dùng chung phải merge ở đó trước, không sửa trực tiếp trong `src/Breads-Shared` của từng repo con.
- **Constraint:** `protectRoute` (Be) chỉ xác thực, không có sẵn cơ chế lấy role — `requireRole` phải tự query `req.user.role` (đã có sau `protectRoute` gắn `req.user`).
- **Assumption:** Không có endpoint quản trị nào khác ngoài 7 endpoint đã liệt kê cần role-check trong scope epic này — nếu sai, cần bổ sung middleware cho endpoint phát hiện thêm.
  - *Nếu sai:* endpoint bị bỏ sót vẫn là lỗ hổng mở — cần rà soát lại toàn bộ router Be trước khi coi epic hoàn thành.
- **Assumption:** Chỉ 2 role (ADMIN, MODERATOR) là đủ cho quy mô hiện tại — nếu sai (cần phân quyền chi tiết hơn theo action), `requireRole` vẫn mở rộng được vì nhận danh sách role linh hoạt, không hardcode.

## Out of Scope

- **Nội dung/business logic chi tiết của Posts CMS, Posts Validation, Report, Overview** — chỉ có route placeholder trong epic này; thiết kế UI/logic chi tiết từng module là epic riêng sau (đã thống nhất từ `office-hours`).
- **Audit log hành động moderation** (ai duyệt/từ chối report nào, khi nào) — chưa có nhu cầu cụ thể được nêu ra, tránh over-engineering.
- **Permission matrix chi tiết theo từng action / đa cấp Moderator** — chưa có bằng chứng cần thiết (bị bác ở `prd-rethink` Phase 3 khi cân nhắc mode EXPAND).
- **`IReport` type đầy đủ** (field `targetType`/`targetId`/`reason`) — cần đọc `report.controller.ts` để xác nhận field thật trước, để dành cho epic module Report.
- **Trang 403 riêng** — dùng redirect `/login` cho mọi trường hợp thiếu quyền (đã chốt ở `prd-rethink` Decision 4), không xây UI 403 riêng trong epic này.

## Dependencies

- [Merge role `MODERATOR` vào `Breads-Shared`] — Owner: @NguyenAnhDuc1711 — Status: chưa bắt đầu (chặn FR-4/5/6/8)
- [Bump submodule pointer ở `Breads-Fe`, `Breads-Be`] — Owner: @NguyenAnhDuc1711 — Status: chờ dependency trên
- [`report.controller.ts` review để xác nhận field `IReport`] — Owner: @NguyenAnhDuc1711 — Status: ngoài scope epic này, ghi nhận cho epic Report sau

## _Metadata

```yaml
requirement_ids: [FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, NFR-1, NFR-2]
scale: medium
discovery_mode: express-path
validation_status: passed
source_artifacts:
  - .ccpm/prds/.design-social-media-management.md
  - .ccpm/prds/.rethink-social-media-management.md
```

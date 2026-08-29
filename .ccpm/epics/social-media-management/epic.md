---
name: "social-media-management"
status: "backlog"
progress: "0%"
created: "2026-08-29T07:27:54Z"
updated: "2026-08-29T07:40:49Z"
prd: ".ccpm/prds/social-media-management.md"
github: "https://github.com/NguyenAnhDuc1711/Breads-Admin/issues/1"
---

## Overview

Epic này xây khung điều hướng cho 5 khu vực quản trị Breads-Admin (chỉ layout/routing, chưa nội dung 4/5) và, quan trọng hơn, đưa authorization thật vào cả `Breads-Be` (hiện chỉ có authentication) lẫn `Breads-Admin` (hiện chỉ có UI gate lúc login, không có route-guard). Kiến trúc chọn cách tối giản nhất giải quyết đúng vấn đề đã xác nhận qua evidence thật (đọc trực tiếp code Breads-Fe/Breads-Be, không suy đoán): 1 middleware role-check generic ở Be, 1 layout component gate ở Fe, 1 role mới thêm vào enum sẵn có — không xây permission-matrix hay generic DataTable vượt quá nhu cầu đã chứng minh. Thứ tự thực thi bắt buộc đi qua `Breads-Shared` trước (submodule dùng chung 3 repo) vì mọi phần còn lại phụ thuộc vào role `MODERATOR` tồn tại ở đó.

## Architecture Decisions

### AD-1: Role model — mở rộng enum số nguyên sẵn có, không chuyển sang permission-based
Context: Cần phân biệt Admin/Moderator nhưng hệ thống hiện dùng `Constants.USER_ROLE = {ADMIN:0, USER:1}` (number enum đơn giản, cả Fe lẫn Be đều so sánh trực tiếp bằng `===`/`in`).
Decision: Thêm `MODERATOR: 2` vào cùng object, giữ kiểu số nguyên.
Alternatives rejected: Permission-based (danh sách permission linh hoạt per user) — over-engineering cho 3 role, không có bằng chứng cần (đã bác ở `prd-rethink` Phase 3 khi cân nhắc EXPAND).
Trade-off: Đơn giản, dễ maintain; kém linh hoạt nếu sau này cần phân quyền theo action cụ thể — chấp nhận được vì `requireRole` (AD-2) nhận danh sách role linh hoạt, mở rộng được.
Reversibility: Easy.

### AD-2: Backend authorization — middleware factory, không check role trong controller
Context: Express routers hiện dùng middleware chain (`protectRoute` → `validate` → controller); 7 endpoint xác định thiếu bước phân quyền.
Decision: 1 file mới `requireRole(...roles: number[])` (factory trả về Express middleware), đọc `req.user.role` — `req.user` đã được `protectRoute` gắn trước đó.
Alternatives rejected: Check role trong từng controller — vi phạm DRY, dễ bị quên khi thêm endpoint mới sau này.
Trade-off: Bắt buộc đúng thứ tự middleware (`protectRoute` trước `requireRole`) — sai thứ tự sẽ crash vì `req.user` chưa tồn tại. Mitigation: test tích hợp riêng cho từng router.
Reversibility: Easy — middleware độc lập, thêm/gỡ không đổi logic controller.

### AD-3: FE routing — nested Route dưới 1 AdminLayout, dùng react-router-dom sẵn có
Context: `App.tsx` hiện là `<Routes>` phẳng, không layout dùng chung.
Decision: `<Route element={<AdminLayout/>}>` bọc 5 route con — không đổi router library (react-router-dom v7 đã là dependency).
Alternatives rejected: Nhiều layout riêng theo nhóm route — không cần thiết, cả 5 route dùng chung đúng 1 sidebar.
Trade-off: Không có.
Reversibility: Easy.

### AD-4: SearchableTable — interface tối giản theo đúng nhu cầu UsersPage, không thiết kế trước cho Posts CMS
Context: UsersPage là mẫu bảng THẬT duy nhất hiện có; Posts CMS (module sau, ngoài scope epic này) có thể cần cột/cell-renderer khác hẳn.
Decision: Props tối giản — `columns`, `data`, `loading`, `searchValue`/`onSearchChange`, `pagination` — đúng những gì UsersPage cần, không hơn.
Alternatives rejected: Generic `DataTable` hỗ trợ sort/custom cell-renderer/filter đầy đủ ngay từ đầu — chưa có bằng chứng cần (Posts CMS chưa xây, xem PRD Risk #4).
Trade-off: Có thể phải mở rộng props khi Posts CMS tới sau này — chấp nhận, rẻ hơn đoán sai bây giờ.
Reversibility: Medium (mở rộng props không phá bản cũ; đổi shape cốt lõi thì khó hơn).

### AD-5: FE route-guard — component-level trong AdminLayout, không dùng React Router `loader`
Context: Cần chặn theo role trước khi hiển thị nội dung route; `App.tsx` hiện khai báo route bằng JSX `<Route>` thuần, chưa dùng data-router API.
Decision: `AdminLayout` tự đọc role qua `useGetCurrentUserQuery` (hook đã có, dùng lại cache), render `<Navigate to="/login"/>` khi role không nằm trong danh sách cho phép của route hiện tại.
Alternatives rejected: `loader`/`action` của react-router v7 — đòi hỏi refactor toàn bộ cách khai báo route hiện tại, vượt quá scope.
Trade-off: Guard chạy theo React render lifecycle (không "resolve" trước khi route vào) — chấp nhận được vì `useGetCurrentUserQuery` đã cache sẵn từ lúc load app (Users page hiện tại đã dùng).
Reversibility: Easy.

## Technical Approach

**`Breads-Shared` (submodule, repo riêng):**
- `Constants/index.ts` — thêm `MODERATOR: 2` vào `USER_ROLE`.

**`Breads-Be`:**
- `src/api/middlewares/requireRole.ts` (mới) — theo đúng pattern file `protectRoute.ts` (function nhận `req,res,next`, ở đây là factory nhận role list rồi trả middleware).
- Wire vào `src/api/routers/user.route.ts` (`GET_USERS_WITH_STATUS`, `UPDATE`), `post.route.ts` (`UPDATE_POST_STATUS`, `UPDATE_POST_VISIBILITY`), `report.route.ts` (`GET`, `RESPONSE`, `REJECT`) — theo đúng bảng role-mapping ở PRD FR-5.
- Bump submodule pointer `src/Breads-Shared` sau khi `Breads-Shared` merge.

**`Breads-Admin`:**
- `src/layouts/AdminLayout.tsx` (mới) — sidebar 5 mục + `<Outlet/>` + route-guard (AD-5).
- `src/App.tsx` — route lồng nhau, 4 route placeholder (Overview `/`, `/posts`, `/posts/validation`, `/report`), `/users` giữ nguyên nhưng chuyển vào trong AdminLayout.
- `src/components/SearchableTable/index.tsx` (mới, AD-4) — refactor `src/pages/UsersPage.tsx` để dùng lại.
- `src/store/api/baseApi.ts` — thêm `tagTypes: ["User", "Post", "Report"]`.
- `src/pages/LoginPage.tsx` — sửa điều kiện `result.role !== Constants.USER_ROLE.ADMIN` thành kiểm tra role thuộc `{ADMIN, MODERATOR}`.
- Bump submodule pointer `src/Breads-Shared`.

## Traceability Matrix

| PRD Requirement | Epic Coverage | Task(s) | Verification |
|---|---|---|---|
| FR-4 (role Moderator) | Technical Approach §Breads-Shared | T1 | Manual: `git submodule status` khớp 3 repo |
| FR-1, FR-2 (AdminLayout + routing) | Technical Approach §Breads-Admin | T2 | Manual: sidebar hiện 5 mục, route load |
| FR-5 (requireRole Be) | Technical Approach §Breads-Be | T3 | Test tự động: 403 khi role không đủ (7 endpoint) |
| FR-3, FR-7, NFR-1 (SearchableTable, baseApi, no-regression) | Technical Approach §Breads-Admin | T4 | Test: hành vi UsersPage giống bản gốc |
| FR-6, FR-8 (route-guard FE, Moderator login) | Technical Approach §Breads-Admin | T5 | Manual: Moderator login được, bị chặn `/users` |
| NFR-2 (thứ tự middleware) | AD-2 | T3 | Test tích hợp: refresh-token flow không đổi |

## Implementation Strategy

**Phase 1 — Nền tảng (critical path):** T1 (role model, chặn mọi task khác) song song T2 (layout/routing FE, độc lập với T1 về code). Exit: `MODERATOR` tồn tại ở cả 3 repo; `AdminLayout` render được 5 route.

**Phase 2 — Core (song song hoá được):** T3 (Be middleware, phụ thuộc T1) song song T4 (SearchableTable, phụ thuộc T2) song song T5 (FE route-guard, phụ thuộc T1+T2). Exit: cả 7 endpoint enforce role đúng; UsersPage không regression; Moderator login + bị chặn đúng route.

**Phase 3 — Xác minh:** T090 — build/lint/test toàn bộ, đối chiếu 6 Success Criteria của PRD.

## Task Breakdown (enriched preview)

##### T1: Role Moderator + submodule sync 3 repo
- Phase: 1 | Parallel: yes | Est: 0.5d | Depends: — | Complexity: simple
- What: Thêm `MODERATOR: 2` vào `Constants.USER_ROLE` ở repo `Breads-Shared`, merge, rồi bump submodule pointer (`git submodule update --remote` hoặc `cd src/Breads-Shared && git checkout <sha>`) ở `Breads-Admin`, `Breads-Fe`, `Breads-Be`.
- Key files: `Breads-Shared/Constants/index.ts`; `.gitmodules`-tracked pointer ở 3 repo
- PRD requirements: FR-4
- Key risk: Bump không đồng bộ → 3 repo lệch SHA (PRD Risk #1)
- Interface produces: `Constants.USER_ROLE.MODERATOR === 2` khả dụng ở cả 3 repo

##### T2: AdminLayout + routing skeleton
- Phase: 1 | Parallel: yes | Est: 1d | Depends: — | Complexity: simple
- What: Tạo `src/layouts/AdminLayout.tsx` (sidebar tĩnh 5 mục + `<Outlet/>`, CHƯA có role-guard — thêm ở T5). Sửa `App.tsx`: route lồng nhau, 4 route mới trỏ tới component placeholder đơn giản (heading + "Sắp ra mắt"), `/users` chuyển vào trong layout. **Bắt buộc xoá route `<Route path="/" element={<Navigate to="/users" replace/>}/>` hiện có** — Overview placeholder mount tại `/` thay vào đó (khớp `PageConstant.ADMIN.DEFAULT` gốc ở Fe, coi Overview là trang chủ admin). Không xoá bước này thì `/` tiếp tục redirect sang `/users`, Overview không bao giờ hiển thị (plan-review ARCH-1).
- Key files: `src/layouts/AdminLayout.tsx` (mới), `src/App.tsx`
- PRD requirements: FR-1, FR-2
- Key risk: Đổi cấu trúc route có thể phá URL hiện tại của `/users` nếu không giữ path y hệt; quên xoá redirect `/` cũ sẽ khiến Overview không bao giờ render (đã ghi rõ ở What)
- Interface produces: `AdminLayout` component export sẵn để T5 thêm guard vào

##### T3: Middleware requireRole + wire 7 endpoint
- Phase: 2 | Parallel: yes | Est: 1.5d | Depends: T1 | Complexity: moderate
- What: Tạo `requireRole(...roles)` theo pattern `protectRoute.ts`. Thêm vào `user.route.ts` (2 endpoint), `post.route.ts` (2 endpoint), `report.route.ts` (3 endpoint) đúng bảng role-mapping PRD FR-5. Endpoint hiện thiếu cả `protectRoute` (post status/visibility, report GET/response/reject) cần thêm `protectRoute` TRƯỚC `requireRole`.
- Key files: `Breads-Be/src/api/middlewares/requireRole.ts` (mới), `user.route.ts`, `post.route.ts`, `report.route.ts`
- PRD requirements: FR-5, NFR-2
- Key risk: Thứ tự middleware sai → `req.user` undefined lúc `requireRole` chạy → crash thay vì 403
- Interface receives from T1: `Constants.USER_ROLE` có `MODERATOR`
- Interface produces: 7 endpoint trả 403 đúng khi role không đủ (dùng bởi T090 để verify)

##### T4: SearchableTable + refactor UsersPage + mở rộng baseApi
- Phase: 2 | Parallel: yes | Est: 1.5d | Depends: T2 | Complexity: moderate
- What: Tạo `src/components/SearchableTable/index.tsx` theo AD-4 (props tối giản). Refactor `UsersPage.tsx` dùng component này, giữ nguyên hành vi search/phân trang/đổi status. Thêm `Post`, `Report` vào `tagTypes` của `baseApi.ts`. **Xác minh bằng kiểm thử thủ công, không phải test tự động** (plan-review TEST-1) — `package.json` của Breads-Admin hiện không có script/framework test nào (chỉ `dev`/`build`/`lint`/`preview`); đối chiếu hành vi trước/sau refactor trực tiếp trên trình duyệt.
- Key files: `src/components/SearchableTable/index.tsx` (mới), `src/pages/UsersPage.tsx`, `src/store/api/baseApi.ts`
- PRD requirements: FR-3, FR-7, NFR-1
- Key risk: Refactor vô tình đổi hành vi (vd: mất debounce search) — không có test tự động để bắt sớm, cần đối chiếu thủ công kỹ với bản trước refactor
- Interface receives from T2: `UsersPage` giờ render trong `AdminLayout`, route `/users` không đổi path

##### T5: FE route-guard theo role + cập nhật LoginPage
- Phase: 2 | Parallel: yes | Est: 1d | Depends: T1, T2 | Complexity: moderate
- What: Thêm logic role-guard vào `AdminLayout` (đọc role qua `useGetCurrentUserQuery`, danh sách role-cho-phép khai báo theo route, `<Navigate to="/login"/>` khi không đủ quyền, ẩn mục sidebar tương ứng). **Default-deny tường minh** (plan-review FAIL-1): nếu `role` không nằm trong danh sách cho phép — kể cả khi `role` là `undefined` hoặc giá trị không nhận diện được — PHẢI coi là không đủ quyền, không được ngầm định "cho qua". Sửa `LoginPage.tsx`: điều kiện chấp nhận đăng nhập đổi từ "role === ADMIN" thành "role thuộc {ADMIN, MODERATOR}". `src/config/routes.ts` — comment cross-reference rõ tới bảng role-mapping ở PRD FR-5, vì đây là 2 nơi khai báo role riêng biệt (FE hiển thị, Be enforce thật) không tự động đồng bộ (plan-review QUAL-1, chấp nhận vì quy mô 5 route/2 role còn nhỏ).
- Key files: `src/layouts/AdminLayout.tsx`, `src/pages/LoginPage.tsx`, `src/config/routes.ts` (mới — khai báo role-cho-phép theo route)
- PRD requirements: FR-6, FR-8
- Key risk: Sửa sai điều kiện ở `LoginPage.tsx` (vd dùng `!==` thay vì check danh sách) vô tình mở đăng nhập cho role USER thường (PRD Risk #3); quên default-deny khi role không hợp lệ (đã ghi rõ ở What)
- Interface receives from T1: `MODERATOR` const; từ T2: `AdminLayout` component đã tồn tại

##### T090: Verification
- Phase: 3 | Parallel: no | Est: 0.5d | Depends: T1, T2, T3, T4, T5 | Complexity: simple
- What: Chạy build (`npm run build`), lint (`npm run lint`) ở `Breads-Admin` (không có script `test` — xem plan-review TEST-1); chạy test suite tự động Be liên quan router đã sửa; đối chiếu thủ công 6 Success Criteria trong PRD (phần FE là kiểm thử thủ công, phần Be là test tự động).
- Key files: — (verification only)
- PRD requirements: tất cả FR/NFR
- Key risk: Bỏ sót 1 trong 7 endpoint khi test 403 — checklist tường minh theo đúng bảng FR-5

## Risks

| # | Risk | Severity | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| 1 | Submodule `Breads-Shared` lệch SHA giữa 3 repo (carried từ PRD) | High | Medium | Type/constant lệch, lỗi khó debug | T1 tách riêng, verify SHA khớp cả 3 repo trước khi chạy T3/T5 |
| 2 | Thứ tự middleware sai ở Be (`requireRole` trước `protectRoute`) | Medium | Low | Crash 500 thay vì 403, hoặc tệ hơn — bỏ qua check | Test tích hợp riêng cho mỗi router đã sửa trong T3 |
| 3 | Sửa sai điều kiện `LoginPage.tsx` mở đăng nhập cho role USER thường | High | Low | Tái tạo đúng lỗ hổng đang cố vá | Test case rõ ràng: role USER phải bị từ chối, chỉ ADMIN/MODERATOR được nhận (T5) |
| 4 | `SearchableTable` (AD-4) trừu tượng hoá sai vì chỉ có 1 mẫu (UsersPage) | Medium | Medium | Sửa lại interface khi Posts CMS tới (epic sau) | Giữ props tối giản, không đoán trước tính năng Posts CMS |
| 5 (kỹ thuật, mới) | 2 endpoint ở `post.route.ts`/`report.route.ts` hiện thiếu cả `protectRoute` (không chỉ thiếu `requireRole`) — thêm `protectRoute` có thể phá client hiện đang gọi các endpoint này mà không gửi token | Medium | Low | T3 kiểm tra client-side (Fe/Admin) đã luôn gửi Authorization header cho các endpoint này trước khi thêm `protectRoute` |
| 6 (kỹ thuật, mới) | `useGetCurrentUserQuery` chưa resolve xong (loading) khi `AdminLayout` render lần đầu → flash-redirect `/login` sai trước khi có dữ liệu role | Low | Medium | T5 chờ `isLoading` false trước khi quyết định redirect (không redirect khi đang loading) |

## Tasks Created

| File | GitHub | Task | Phase | Parallel | Depends | Est |
|---|---|---|---|---|---|---|
| 2.md | [#2](https://github.com/NguyenAnhDuc1711/Breads-Admin/issues/2) | Role Moderator + submodule sync 3 repo | 1 | yes | — | 0.5d |
| 3.md | [#3](https://github.com/NguyenAnhDuc1711/Breads-Admin/issues/3) | AdminLayout + routing skeleton | 1 | yes | — | 1d |
| 4.md | [#4](https://github.com/NguyenAnhDuc1711/Breads-Admin/issues/4) | Middleware requireRole + wire 7 endpoint | 2 | yes | #2 | 1.5d |
| 5.md | [#5](https://github.com/NguyenAnhDuc1711/Breads-Admin/issues/5) | SearchableTable + refactor UsersPage + baseApi | 2 | yes | #3 | 1.5d |
| 6.md | [#6](https://github.com/NguyenAnhDuc1711/Breads-Admin/issues/6) | FE route-guard theo role + LoginPage | 2 | yes | #2, #3 | 1d |
| 7.md | [#7](https://github.com/NguyenAnhDuc1711/Breads-Admin/issues/7) | Verification | 3 | no | #2,#3,#4,#5,#6 | 0.5d |

Epic issue: [#1](https://github.com/NguyenAnhDuc1711/Breads-Admin/issues/1)

Dependency graph:
```
#2 ──┬──────────────► #4 ──┐
     └──► #6 ◄──┐          │
#3 ──┴───────────┴──► #5 ─┼──► #7
                    #6 ───┘
```
(#2, #3 chạy song song Phase 1 → #4, #5, #6 chạy song song Phase 2, mỗi task chờ đúng dependency của nó → #7 chờ cả 5.)

Tổng: 6 task, 5/6 đánh dấu `parallel: true` (090 tuần tự vì là verification cuối), effort ước tính ~6 ngày (có thể rút ngắn nhờ song song hoá Phase 2).

## PRD Coverage

| Requirement | Task(s) | Covered |
|---|---|---|
| FR-1 | #3 | ✅ |
| FR-2 | #3 | ✅ |
| FR-3 | #5 | ✅ |
| FR-4 | #2 | ✅ |
| FR-5 | #4 | ✅ |
| FR-6 | #6 | ✅ |
| FR-7 | #5 | ✅ |
| FR-8 | #6 | ✅ |
| NFR-1 | #5 | ✅ |
| NFR-2 | #4 | ✅ |

8/8 FR + 2/2 NFR covered (100%).

## Success Criteria (Technical)

| PRD Success Criterion | Technical Metric | Target | Measurement |
|---|---|---|---|
| 1. Phân quyền Backend | % endpoint (trong 7) trả 403 đúng với role thiếu | 100% (7/7) | Test tự động trong T3 |
| 2. Điều hướng đầy đủ | Số route đích load được qua sidebar, không lỗi | 5/5 | Manual browser check (T090) |
| 3. Không regression UsersPage | Test/kiểm thử thủ công search+phân trang+đổi status | Pass 100% | So sánh hành vi trước/sau refactor (T4) |
| 4. Đồng bộ submodule | Số repo có cùng SHA `Breads-Shared` | 3/3 | `git submodule status` mỗi repo (T1, T090) |
| 5. Route-guard đúng role | Moderator bị chặn `/users`, không thấy mục sidebar | Pass | Manual test tài khoản Moderator thật (T5) |
| 6. Moderator đăng nhập được | Đăng nhập thành công với role Moderator | Pass | Manual test (T5) |

---
epic: social-media-management
prd: .ccpm/prds/social-media-management.md
mode: full
reviewer: claude
created: 2026-08-29T07:32:43Z
verdict: ready
critical_gaps: 0
warnings: 0
---

# Plan Review: social-media-management

Ghi chú hạ tầng: `scripts/pm/exit-gate-check.sh` và các script telemetry (`timeline-log.sh`) không tồn tại trong project này — review chạy đủ nội dung theo protocol nhưng không gọi các script đó; đóng bằng closing-verdict tường minh ở cuối file theo đúng format yêu cầu.

## Step 0: Scope Challenge

**0A. Existing Code Audit:**

| Sub-problem | Existing code | Reuse? | Gap |
|---|---|---|---|
| Xác thực request | `protectRoute.ts` | Reuse nguyên trạng | Không |
| Enum role | `Constants.USER_ROLE` | Mở rộng (thêm MODERATOR) | Không |
| Data-fetch pattern FE | `userApi.ts` (injectEndpoints) | Pattern tái dùng cho module tương lai (ngoài epic này) | N/A |
| Bảng UI | Code bảng inline trong `UsersPage.tsx` | Rút thành `SearchableTable` | Đã có AD-4 xử lý |
| Layout điều hướng FE | Không tồn tại | Xây mới (`AdminLayout`) | Đã có T2 xử lý |

**0B. Complexity Assessment:**
```
Files touched: 12 (>8 = smell, xác nhận — chủ yếu do trải 3 repo)
New components: 2 (AdminLayout, SearchableTable — đúng ngưỡng, không phải smell)
Task count: 6 / parallel: lên tới 3/6 đồng thời ở Phase 2
Cross-epic conflicts: không có epic active nào khác
```

**0C. PRD Alignment Quick Check:**
```
MUST requirements: 8/8 mapped (100%)
Unmapped: (không có)
```

**0D. Implementation Alternatives:** Bỏ qua — epic đã có 5 ADR bàn approach + alternatives rejected.

**0E. Completeness (Lake Score):** Không áp dụng — các quyết định scope (đặc biệt AD-4) đều dựa trên bằng chứng thật (2 mẫu bảng đã đối chiếu), không phải shortcut để né effort.

**Scope check (D-1):** Đã hỏi user do files>8 — user chọn **Proceed**.

## Section 1: Architecture Review

```
[FE: Breads-Admin]                    [BE: Breads-Be]
  App.tsx                               user.route.ts ─┐
   └─ AdminLayout* (sidebar+guard)      post.route.ts ─┼─ requireRole* ─ controller
        ├─ Overview (placeholder)       report.route.ts┘
        ├─ SearchableTable* ─ UsersPage
        ├─ Posts (placeholder)
        ├─ PostsValidation (placeholder)
        └─ Report (placeholder)
                │
                ▼ useGetCurrentUserQuery (baseApi)
                        │
[Breads-Shared submodule] Constants.USER_ROLE.MODERATOR* ── dùng chung 3 repo
```
(* = component/middleware mới)

Data flow: role đọc 1 lần qua `useGetCurrentUserQuery` (cache RTK Query), dùng lại ở cả sidebar-render lẫn route-guard — không có double-fetch. State management không đổi (vẫn RTK Query, không thêm store mới). Coupling: `AdminLayout` phụ thuộc `baseApi`/`userApi` hiện có — hợp lý, không tạo coupling mới. Rollback posture: mọi thay đổi Be đều additive (middleware mới, route path không đổi) — rollback = revert commit, không cần migration dữ liệu.

**Security smell check:** Có — đây chính là trọng tâm epic (thêm authorization). Đã review kỹ ở AD-2/AD-5.

**ARCH-1 (đã tìm thấy, đã fix):** T2 mount Overview tại `/` nhưng không xử lý redirect `/`→`/users` đang tồn tại trong `App.tsx` hiện tại → Overview sẽ không bao giờ render. **Áp dụng fix:** T2 giờ yêu cầu tường minh xoá redirect cũ, mount Overview tại `/`.

## Section 2: Failure Mode Analysis

```
TABLE 1 — WHAT CAN FAIL
| Codepath | What can fail | Exception/Error class |
| requireRole (Be) | req.user chưa tồn tại (thứ tự middleware sai) | TypeError (đọc role của undefined) |
| AdminLayout guard (FE) | role chưa load xong (query đang pending) | N/A — cần chờ, không phải lỗi |
| AdminLayout guard (FE) | role tồn tại nhưng không hợp lệ | Logic error nếu không default-deny |
| LoginPage (FE) | Điều kiện role check viết sai | Logic error — mở quyền quá rộng |
```
```
TABLE 2 — HOW IT'S HANDLED
| Exception | Rescued? | Rescue Action | User sees | Test? | Severity |
| requireRole thứ tự sai | Y (NFR-2 + T3 test tích hợp) | Đặt đúng thứ tự sau protectRoute | 500 nếu vẫn sai | Y (T3) | Medium |
| role đang loading | Y (Risk #6, T5) | Không redirect khi isLoading | Không có flash-redirect | Manual (T5) | Low |
| role không hợp lệ | Y (FAIL-1, đã fix vào T5) | Default-deny tường minh | Redirect /login | Manual (T5) | Medium→giảm sau fix |
| LoginPage role check sai | Y (Risk #3, T5) | Test case role USER bị từ chối | Từ chối đăng nhập | Manual (T5) | High→giảm sau fix |
```

Shadow paths cho AdminLayout guard: happy (role hợp lệ → render) ✓ | nil (đang loading) ✓ đã xử lý | empty/invalid (role sai giá trị) ✓ đã fix (FAIL-1) | error (query lỗi mạng) → đã có `baseQueryWithReauth` xử lý redirect `/login` ở tầng `baseApi`, không cần AdminLayout xử lý lại.

## Section 3: Code Quality & DRY Review

**QUAL-1 (đã tìm thấy, đã fix):** Role-per-route ở FE (`routes.ts`) và role-mapping ở Be (bảng FR-5) là 2 nguồn khai báo tách biệt, không tự động đồng bộ. Rủi ro là UX drift (không phải lỗ hổng bảo mật — Be vẫn là nơi enforce thật, fail-safe đúng hướng). **Áp dụng fix:** thêm comment cross-reference trong `routes.ts` trỏ về bảng FR-5; không xây abstraction dùng chung vì quy mô 5 route/2 role còn quá nhỏ để đáng effort (Boil Lakes).

Không có DRY violation khác đáng kể — `requireRole` và `SearchableTable` đều là điểm rút trừu tượng hợp lý (2 bằng chứng thật/pattern rõ ràng), không over-engineering.

## Section 4: Test Strategy Review

```
TEST COVERAGE MAP
| What's new | Happy path? | Failure path? | Edge case? | Test type |
| requireRole middleware (Be) | Y | Y (403 role thiếu) | Y (thứ tự middleware, NFR-2) | Automated (T3, Be có sẵn framework) |
| AdminLayout + routing (FE) | Y | Y (redirect /login) | Y (loading state) | Manual (Breads-Admin không có test framework) |
| SearchableTable + UsersPage refactor (FE) | Y | N/A | Y (empty state) | Manual (đối chiếu bản trước refactor) |
| LoginPage role check (FE) | Y | Y (role USER bị từ chối) | — | Manual |
```

**TEST-1 (đã tìm thấy, đã fix):** `package.json` Breads-Admin không có script `test`. T4/T090 gốc dùng từ "test" cho phần FE gây hiểu nhầm là có test tự động. **Áp dụng fix:** đổi wording T4/T090 thành "kiểm thử thủ công" tường minh, khớp với PRD Success Criteria vốn đã hedge đúng.

## Section 5: Performance & Resource Review

Bỏ qua theo Context Pressure Protocol — PRD không đề cập yêu cầu performance, epic không có vòng lặp I/O hay batch call quy mô lớn.

## Section 6: PRD Traceability Audit

```
| PRD Req | Epic maps to | Task(s) | Verification | Status |
| FR-1 | AD-3, §Breads-Admin | T2 | Manual | mapped |
| FR-2 | AD-3, §Breads-Admin | T2 | Manual | mapped |
| FR-3 | AD-4, §Breads-Admin | T4 | Manual (TEST-1 fix) | mapped |
| FR-4 | AD-1, §Breads-Shared | T1 | Manual (submodule SHA) | mapped |
| FR-5 | AD-2, §Breads-Be | T3 | Automated | mapped |
| FR-6 | AD-5, §Breads-Admin | T5 | Manual | mapped |
| FR-7 | §Breads-Admin | T4 | Type-check | mapped |
| FR-8 | §Breads-Admin | T5 | Manual | mapped |
| NFR-1 | AD-4 | T4 | Manual (TEST-1 fix) | mapped |
| NFR-2 | AD-2 | T3 | Automated | mapped |
```
0 unmapped MUST requirement.

## Required Outputs

**1. Existing Code Reuse:**
| Functionality | Existing code | Reused? | Recommendation |
|---|---|---|---|
| Xác thực | `protectRoute.ts` | Y | Giữ nguyên, không viết lại |
| Role enum | `Constants.USER_ROLE` | Y (mở rộng) | Thêm giá trị, không đổi kiểu dữ liệu |
| RTK Query pattern | `userApi.ts` | Y (pattern, chưa cần file mới trong epic này) | Theo đúng khi build module Post/Report sau |

**2. Not in Scope:** Nội dung 4 module con, audit log, permission matrix chi tiết, `IReport` đầy đủ, trang 403 riêng — tất cả đã liệt kê rõ ràng kèm lý do ở PRD §Out of Scope, không lặp lại ở đây.

**3. Failure Modes Registry:** 4 exception path đã map (bảng Section 2) — 0 CRITICAL GAP còn mở, 0 WARNING còn mở (cả 2 case rủi ro medium/high ban đầu đã có rescue action + test/manual-check gắn task cụ thể).

**4. Unresolved Decisions:** Không còn — cả 4 finding (ARCH-1, FAIL-1, TEST-1, QUAL-1) đã áp dụng fix trực tiếp vào `epic.md` trong phiên review này.

**5. Completion Summary:**

```
PLAN REVIEW — COMPLETION SUMMARY
Epic:              social-media-management
Mode:              FULL
PRD coverage:      8/8 MUST requirements mapped (100%)

Arch issues: 1 (fixed)   |  Failure modes: 4 (0 critical còn mở)
Quality: 1 (fixed)       |  Test gaps: 1 (fixed — wording)
Perf: bỏ qua (N/A)       |  PRD trace: 0 unmapped

Code reuse: 3 mục tái dùng |  Deferred: 5 (Out of Scope PRD) |  Unresolved: 0
Lake Score: N/A (không có quyết định shortcut-vs-full nào cần chấm)

VERDICT:  READY
Reason:   0 critical gap còn mở, 0 unmapped MUST, 0 unresolved decision — cả 4 finding đã fix trực tiếp vào epic.md trong phiên review.
```

NO UNRESOLVED DECISIONS

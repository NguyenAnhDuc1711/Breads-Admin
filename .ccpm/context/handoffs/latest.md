# Handoff: Task #5

## What Was Done
Tạo `src/components/SearchableTable/index.tsx` (props: `columns`, `data`, `rowKey`, `loading`, `searchValue`/`onSearchChange`, `currentPage`/`totalPages`/`setCurrentPage`, `emptyMessage?`). Refactor `UsersPage.tsx` để dùng component này, giữ nguyên 100% logic (state, debounce, RTK Query hooks, cell markup). Thêm `Post`, `Report` vào `tagTypes` của `baseApi.ts`.

## Decisions Made
- Thêm 1 field `cellStyle?: CSSProperties` vào `SearchableTableColumn` (không có trong phác thảo ban đầu ở task file) — cần thiết để giữ đúng width/textAlign vốn nằm ở cấp `<td>` trong bản gốc `UsersPage.tsx`; không thêm field này sẽ làm lệch layout cột so với bản gốc, vi phạm NFR-1 (không regression). Vẫn đúng tinh thần AD-4 (tối giản, chỉ thêm field UsersPage THẬT SỰ cần).
- `setCurrentPage` truyền thẳng `Dispatch<SetStateAction<number>>` (không bọc qua `onPageChange(page)`) — khớp đúng signature `PaginationBtn` đang cần (`(updater: (prev:number)=>number) => void`), tránh phải viết wrapper thừa.

## Files Changed
- `src/components/SearchableTable/index.tsx` (mới)
- `src/pages/UsersPage.tsx` (refactor, hành vi giữ nguyên)
- `src/store/api/baseApi.ts` (tagTypes mở rộng)

## Verification Done
- `npm run build` + `npm run lint` pass.
- Test trực tiếp trên trình duyệt với Be thật đang chạy (không phải mock): bảng load đúng data thật, search "ethan" debounce đúng rồi trả 3 kết quả đúng, avatar/status dropdown/nút "See detail" hiển thị đúng như bản gốc, phân trang hiển thị đúng.

## Warnings for Next Task
- Task #6 (route-guard) không chạm file nào của task này — an toàn song song.
- `SearchableTable` chưa được dùng ở đâu khác ngoài `UsersPage` — khi build Posts CMS (epic sau), rất có thể cần thêm field vào `SearchableTableColumn` (vd: custom header render) — đã lường trước ở AD-4/Risk #4 của epic, không phải bất ngờ.

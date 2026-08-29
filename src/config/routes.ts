import { Constants } from "@/Breads-Shared/Constants";

// Role-cho-phép theo route. Đây là khai báo RIÊNG ở FE (chỉ ảnh hưởng UI:
// ẩn nav item / redirect sớm) — nguồn enforce THẬT là middleware requireRole
// ở Breads-Be (xem PRD FR-5 bảng role-mapping, epic social-media-management
// task #4). 2 nơi này không tự động đồng bộ — cập nhật cả 2 khi thêm/đổi
// route quản trị mới.
export const ROUTE_ROLES: Record<string, number[]> = {
  "/": [Constants.USER_ROLE.ADMIN, Constants.USER_ROLE.MODERATOR],
  "/posts": [Constants.USER_ROLE.ADMIN, Constants.USER_ROLE.MODERATOR],
  "/posts/validation": [
    Constants.USER_ROLE.ADMIN,
    Constants.USER_ROLE.MODERATOR,
  ],
  "/report": [Constants.USER_ROLE.ADMIN, Constants.USER_ROLE.MODERATOR],
  "/users": [Constants.USER_ROLE.ADMIN],
};

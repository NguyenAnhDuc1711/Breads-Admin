import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { ROUTE_ROLES } from "@/config/routes";
import { useGetCurrentUserQuery } from "@/store/api/userApi";
import "./AdminLayout.css";

const NAV_ITEMS = [
  { path: "/", label: "Overview" },
  { path: "/posts", label: "Posts" },
  { path: "/posts/validation", label: "Posts Validation" },
  { path: "/report", label: "Report" },
  { path: "/users", label: "Users" },
];

const AdminLayout = () => {
  const location = useLocation();
  const { data: currentUser, isLoading } = useGetCurrentUserQuery();

  // Chưa có dữ liệu role — không được redirect vội (tránh flash-redirect
  // /login trước khi query resolve xong).
  if (isLoading) {
    return null;
  }

  // Ưu tiên khớp tuyệt đối; nếu không có, dùng tiền tố dài nhất — route con dạng
  // "/users/:id" không có key riêng trong ROUTE_ROLES, dùng chung quyền của route
  // cha đã khai báo (vd. "/users").
  const matchedRouteKey =
    location.pathname in ROUTE_ROLES
      ? location.pathname
      : Object.keys(ROUTE_ROLES)
          .filter((key) => key !== "/" && location.pathname.startsWith(`${key}/`))
          .sort((a, b) => b.length - a.length)[0];
  const allowedRoles = matchedRouteKey
    ? ROUTE_ROLES[matchedRouteKey]
    : undefined;
  // Default-deny: role không nằm trong danh sách cho phép — kể cả
  // currentUser/role không tồn tại — luôn bị coi là không đủ quyền.
  const hasAccess =
    !!allowedRoles &&
    !!currentUser &&
    allowedRoles.includes(currentUser.role);

  if (!hasAccess) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-layout d-flex">
      <nav className="admin-layout__sidebar">
        <div className="admin-layout__brand">Breads Admin</div>
        <ul className="admin-layout__nav list-unstyled">
          {NAV_ITEMS.filter((item) =>
            ROUTE_ROLES[item.path]?.includes(currentUser.role),
          ).map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `admin-layout__link${isActive ? " admin-layout__link--active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="admin-layout__content flex-fill">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

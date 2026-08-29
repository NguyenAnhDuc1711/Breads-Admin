import { NavLink, Outlet } from "react-router-dom";
import "./AdminLayout.css";

const NAV_ITEMS = [
  { path: "/", label: "Overview" },
  { path: "/posts", label: "Posts" },
  { path: "/posts/validation", label: "Posts Validation" },
  { path: "/report", label: "Report" },
  { path: "/users", label: "Users" },
];

const AdminLayout = () => {
  return (
    <div className="admin-layout d-flex">
      <nav className="admin-layout__sidebar">
        <div className="admin-layout__brand">Breads Admin</div>
        <ul className="admin-layout__nav list-unstyled">
          {NAV_ITEMS.map((item) => (
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

import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import PostsPage from "./pages/PostsPage";
import PostsValidationPage from "./pages/PostsValidationPage";
import ReportPage from "./pages/ReportPage";
import UserDetailPage from "./pages/UserDetailPage";
import UsersPage from "./pages/UsersPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AdminLayout />}>
        {/* OverviewPage tạm disable (chưa QA tay xong) — "/" redirect thẳng
            sang "/posts", giữ trong ROUTE_ROLES để vẫn qua role-gate trước
            khi redirect. Bật lại: đổi element về <OverviewPage />. */}
        <Route path="/" element={<Navigate to="/posts" replace />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/validation" element={<PostsValidationPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;

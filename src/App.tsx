import { Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
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
        <Route path="/" element={<OverviewPage />} />
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

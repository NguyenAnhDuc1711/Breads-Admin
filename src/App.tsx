import { Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import ComingSoonPage from "./pages/ComingSoonPage";
import LoginPage from "./pages/LoginPage";
import UserDetailPage from "./pages/UserDetailPage";
import UsersPage from "./pages/UsersPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AdminLayout />}>
        <Route path="/" element={<ComingSoonPage title="Overview" />} />
        <Route path="/posts" element={<ComingSoonPage title="Posts" />} />
        <Route
          path="/posts/validation"
          element={<ComingSoonPage title="Posts Validation" />}
        />
        <Route path="/report" element={<ComingSoonPage title="Report" />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;

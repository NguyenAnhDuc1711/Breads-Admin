import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Constants } from "@/Breads-Shared/Constants";
import { setAccessToken } from "@/Breads-Shared/Auth/TokenManager";
import { useLoginMutation, useLogoutMutation } from "@/store/api/userApi";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [logout] = useLogoutMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await login({ email, password }).unwrap();
      const allowedLoginRoles: number[] = [
        Constants.USER_ROLE.ADMIN,
        Constants.USER_ROLE.MODERATOR,
      ];
      if (!allowedLoginRoles.includes(result.role)) {
        // Login already set a valid refreshToken cookie server-side — undo
        // it, this account has no business holding an admin session.
        await logout();
        setError("This account does not have access to the admin panel.");
        return;
      }
      setAccessToken(result.accessToken);
      // "/posts" thay vì "/users" — Users giờ chỉ dành ADMIN (xem
      // src/config/routes.ts), Moderator vào "/users" sẽ bị AdminLayout đá
      // ngược lại /login ngay lập tức nếu điều hướng tới đó. Overview ("/")
      // tạm disable — xem src/App.tsx.
      navigate("/posts");
    } catch {
      setError("Incorrect email or password.");
    }
  };

  return (
    <div className="login-page">
      <form className="login-page__card" onSubmit={handleSubmit}>
        <h1 className="login-page__title">Breads Admin</h1>
        <p className="login-page__subtitle">Sign in to continue</p>

        {error && <div className="login-page__error">{error}</div>}

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-dark w-100"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;

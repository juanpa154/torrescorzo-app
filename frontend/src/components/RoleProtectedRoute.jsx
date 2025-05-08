import { Navigate } from "react-router-dom";
import { getToken } from "../services/api";

export default function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const token = getToken();
  if (!token) return <Navigate to="/" />;

  const user = JSON.parse(atob(token.split(".")[1]));
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;

  return children;
}

import { Navigate } from "react-router-dom";
import { getToken } from "../services/api";

export default function PrivateRoute({ children }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/" />;
  }
  return children;
}

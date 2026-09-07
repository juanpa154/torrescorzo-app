import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Announcements from "./pages/Announcements";
import PrivateRoute from "./components/PrivateRoute";
import NewAnnouncement from "./pages/NewAnnouncement";
import Dashboard from "./pages/Dashboard";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { getToken } from "./services/api";
import { decodeToken } from "./utils/jwt";
import AdminPanel from "./pages/AdminPanel";
import EmployeeDirectory from "./pages/EmployeeDirectory";
import NewEmployee from "./pages/NewEmployee";
import EditEmployee from "./pages/EditEmployee";
import SettingsPanel from "./pages/SettingsPanel";
import EmployeeStats from "./pages/EmployeeStats";
import CfdiViewer from "./pages/CfdiViewer";
import CfdiRecibidos from "./pages/CfdiRecibidos";
import CfdiDashboard from "./pages/CfdiDashboard";
import CodigosForm from "./pages/CodigosForm";
import Navbar from "./components/Navbar";

function AppLayout({ user, setUser }) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <>
      {user && !isLoginPage && (
        <Navbar user={user} onLogout={handleLogout} />
      )}

      <Routes>
        <Route path="/" element={<Login onLogin={setUser} />} />
        <Route
          path="/register"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <Register />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <PrivateRoute>
              <Announcements />
            </PrivateRoute>
          }
        />
        <Route
          path="/new"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "editor"]}>
              <NewAnnouncement />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/directory"
          element={
            <PrivateRoute>
              <EmployeeDirectory />
            </PrivateRoute>
          }
        />
        <Route
          path="/directory/new"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "editor"]}>
              <NewEmployee />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/directory/edit/:id"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <EditEmployee />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "editor"]}>
              <SettingsPanel />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/directory/stats"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "editor"]}>
              <EmployeeStats />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/cfdi/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "editor"]}>
              <CfdiDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/cfdi/emitidos"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "editor"]}>
              <CfdiViewer />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/cfdi/recibidos"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "editor"]}>
              <CfdiRecibidos />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/codigos"
          element={
            <PrivateRoute>
              <CodigosForm />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const decoded = decodeToken(getToken());
    // token ausente o malformado – no lo borramos para no romper PrivateRoute
    if (decoded) setUser(decoded);
  }, []);

  return (
    <BrowserRouter>
      <AppLayout user={user} setUser={setUser} />
    </BrowserRouter>
  );
}
